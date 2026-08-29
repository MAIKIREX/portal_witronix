"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiError, type ApiError } from "@/lib/http";
import { authApi } from "../api";
import { startSession } from "../session-manager";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const result = await authApi.login(values.email, values.password);
      startSession(result.user);

      const redirect = searchParams.get("redirect");
      // Solo destinos internos: un `redirect` absoluto en la URL permitiria
      // enviar al usuario a otro dominio tras identificarse (open redirect).
      const target =
        redirect && redirect.startsWith("/") && !redirect.startsWith("//")
          ? redirect
          : "/dashboard";

      router.replace(target);
    } catch (error) {
      setFormError(toLoginMessage(error));
    }
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contrasena</Label>
          <Link
            href="/recuperar"
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            He olvidado mi contrasena
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors focus:outline-none"
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="bg-tone-danger text-tone-danger-fg rounded-md px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

/**
 * El backend no distingue entre email inexistente y contrasena incorrecta
 * (anti-enumeracion), asi que aqui tampoco: se muestra su mensaje tal cual.
 */
function toLoginMessage(error: unknown): string {
  if (!isApiError(error)) return "No se ha podido iniciar sesion.";
  const apiError = error as ApiError;

  if (apiError.kind === "rate-limit") {
    return "Demasiados intentos de acceso. Espera un minuto y vuelve a probar.";
  }
  return apiError.message;
}
