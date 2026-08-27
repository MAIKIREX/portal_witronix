"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/common/loading-screen";
import { isApiError } from "@/lib/http";
import { authApi } from "../api";
import { startSession } from "../session-manager";
import { PasswordField } from "./password-field";
import {
  acceptInvitationSchema,
  type AcceptInvitationValues,
} from "../schemas";
import type { InvitationPreview } from "../types";
import { ROLE_LABELS } from "@/lib/labels";

export function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Se precarga la invitacion para mostrar a quien pertenece antes de pedir
  // la contrasena. Aqui si hay endpoint de validacion previa (a diferencia
  // del restablecimiento), asi que un enlace caducado se detecta al abrirlo.
  useEffect(() => {
    let active = true;
    authApi
      .getInvitation(token)
      .then((data) => {
        if (active) setInvitation(data);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(
          isApiError(error)
            ? error.message
            : "No se ha podido cargar la invitacion.",
        );
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(values: AcceptInvitationValues) {
    setFormError(null);
    try {
      // Aceptar devuelve una sesion completa: se entra directo, sin pasar
      // por el formulario de login.
      const result = await authApi.acceptInvitation(token, values.password);
      startSession(result.user);
      sileo.success({
        title: `Bienvenido, ${result.user.name.split(" ")[0]}`,
        description: "Tu cuenta ya esta activa.",
      });
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        isApiError(error)
          ? error.message
          : "No se ha podido activar la cuenta.",
      );
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p
          role="alert"
          className="bg-tone-danger text-tone-danger-fg rounded-md px-3 py-2 text-sm"
        >
          {loadError}
        </p>
        <p className="text-muted-foreground text-sm">
          Pide a tu contacto en Witronix que te envie una invitacion nueva.
        </p>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href="/login" />}
          nativeButton={false}
        >
          Ir a la pantalla de acceso
        </Button>
      </div>
    );
  }

  if (!invitation) return <LoadingScreen label="Cargando invitacion…" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="bg-muted space-y-1 rounded-md px-3 py-2 text-sm">
        <p className="font-medium">{invitation.name}</p>
        <p className="text-muted-foreground">{invitation.email}</p>
        <p className="text-muted-foreground text-xs">
          Rol: {ROLE_LABELS[invitation.role] ?? invitation.role}
        </p>
      </div>

      <PasswordField
        id="password"
        label="Crea tu contrasena"
        hint="Minimo 10 caracteres, con mayuscula, minuscula y numero."
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
        <p
          role="alert"
          className="bg-tone-danger text-tone-danger-fg rounded-md px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Activando…" : "Activar mi cuenta"}
      </Button>
    </form>
  );
}
