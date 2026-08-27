"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Campo de contrasena con conmutador de visibilidad.
 *
 * Poder ver lo que se escribe reduce errores en contrasenas largas, y la regla
 * del backend exige 10 caracteres con mayuscula, minuscula y numero.
 */
export function PasswordField({
  id,
  label,
  autoComplete = "new-password",
  error,
  hint,
  registration,
}: {
  id: string;
  label: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="pr-9"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center"
          aria-label={
            visible ? "Ocultar contrasena" : "Mostrar contrasena"
          }
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
