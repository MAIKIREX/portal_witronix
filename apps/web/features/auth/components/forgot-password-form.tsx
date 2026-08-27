"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiError } from "@/lib/http";
import { useCooldown } from "@/hooks/use-cooldown";
import { authApi } from "../api";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../schemas";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { secondsLeft, isCoolingDown, start } = useCooldown();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (error) {
      if (isApiError(error) && error.kind === "rate-limit") {
        // El backend limita este endpoint a 3/min.
        start(60);
        setFormError(
          "Has pedido demasiados enlaces seguidos. Espera un momento.",
        );
        return;
      }
      setFormError(
        isApiError(error) ? error.message : "No se ha podido enviar el enlace.",
      );
    }
  }

  // El backend responde siempre 202, exista la cuenta o no (para no revelar
  // que emails estan registrados). El mensaje debe ser igual en ambos casos.
  if (sent) {
    return (
      <div className="space-y-4">
        <p className="bg-tone-success text-tone-success-fg rounded-md px-3 py-2 text-sm">
          Si existe una cuenta con ese email, recibiras un enlace para
          restablecer tu contrasena. Caduca en 2 horas.
        </p>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href="/login" />}
          nativeButton={false}
        >
          Volver a entrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="bg-tone-warning text-tone-warning-fg rounded-md px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || isCoolingDown}
      >
        {isCoolingDown
          ? `Espera ${secondsLeft}s`
          : isSubmitting
            ? "Enviando…"
            : "Enviarme el enlace"}
      </Button>

      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground block text-center text-xs"
      >
        Volver a entrar
      </Link>
    </form>
  );
}
