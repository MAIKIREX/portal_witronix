"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/http";
import { authApi } from "../api";
import { logout } from "../session-manager";
import { passwordSchema } from "../schemas";
import { PasswordField } from "./password-field";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Introduce tu contrasena actual"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

type Values = z.input<typeof schema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      // El backend invalida TODAS las sesiones al cambiar la contrasena,
      // incluida esta: hay que volver a entrar. Se avisa antes de expulsar.
      sileo.success({
        title: "Contrasena actualizada",
        description: "Vuelve a entrar con la nueva contrasena.",
      });
      await logout();
      router.replace("/login");
    } catch (error) {
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
        id="current-password"
        label="Contrasena actual"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        registration={register("currentPassword")}
      />
      <PasswordField
        id="new-password"
        label="Nueva contrasena"
        hint="Minimo 10 caracteres, con mayuscula, minuscula y numero."
        error={errors.newPassword?.message}
        registration={register("newPassword")}
      />
      <PasswordField
        id="confirm-new-password"
        label="Repite la nueva contrasena"
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword")}
      />

      {formError && (
        <p
          role="alert"
          className="bg-tone-danger text-tone-danger-fg rounded-md px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <p className="text-muted-foreground text-xs">
        Al cambiarla se cerraran todas tus sesiones, incluida esta.
      </p>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : "Cambiar contrasena"}
      </Button>
    </form>
  );
}
