"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/http";
import { authApi } from "../api";
import { PasswordField } from "./password-field";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";

const PASSWORD_HINT =
  "Minimo 10 caracteres, con mayuscula, minuscula y numero.";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      await authApi.resetPassword(token, values.password);
      // Restablecer la contrasena invalida todas las sesiones en el backend,
      // asi que hay que volver a entrar; no se puede encadenar con un login.
      sileo.success({
        title: "Contrasena actualizada",
        description: "Ya puedes entrar con tu nueva contrasena.",
      });
      router.replace("/login");
    } catch (error) {
      // No hay endpoint para validar el token antes de enviarlo: si esta
      // caducado o ya usado, se descubre justo aqui.
      setFormError(
        isApiError(error)
          ? error.message
          : "No se ha podido cambiar la contrasena.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <PasswordField
        id="password"
        label="Nueva contrasena"
        hint={PASSWORD_HINT}
        error={errors.password?.message}
        registration={register("password")}
      />
      <PasswordField
        id="confirmPassword"
        label="Repite la contrasena"
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword")}
      />

      {formError && (
        <div
          role="alert"
          className="bg-tone-danger text-tone-danger-fg space-y-2 rounded-md px-3 py-2 text-sm"
        >
          <p>{formError}</p>
          <Link href="/recuperar" className="block underline">
            Pedir un enlace nuevo
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : "Cambiar contrasena"}
      </Button>
    </form>
  );
}
