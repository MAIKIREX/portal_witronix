import { z } from "zod";

/**
 * Esquemas de los formularios de autenticacion.
 *
 * Las reglas replican las del backend (apps/api/.../dto/auth.dto.ts) para dar
 * el error antes de gastar una peticion. El backend sigue validando: esto es
 * comodidad, no seguridad.
 */

/** Misma regla que PASSWORD_RULE en el backend. */
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]{10,}$/;

export const passwordSchema = z
  .string()
  .max(128, "La contrasena no puede superar los 128 caracteres")
  .regex(
    PASSWORD_RULE,
    "Debe tener al menos 10 caracteres, con mayuscula, minuscula y numero",
  );

export const emailSchema = z
  .email("Introduce un email valido")
  // El backend normaliza con trim().toLowerCase(); se hace igual aqui para que
  // lo que se valida sea exactamente lo que se envia.
  .transform((v) => v.trim().toLowerCase());

/**
 * En el login la contrasena solo se comprueba que no este vacia: las cuentas
 * antiguas pueden no cumplir la regla actual, y aplicarla aqui las dejaria
 * fuera con un mensaje enganoso.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introduce tu contrasena"),
});
export type LoginValues = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;

export const acceptInvitationSchema = resetPasswordSchema;
export type AcceptInvitationValues = ResetPasswordValues;
