import type { Role } from "@witronix/shared";

/** Usuario de la sesion. Es lo que devuelven /auth/login y /auth/me. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Solo lo tienen los usuarios con rol CLIENT; para el equipo interno es null. */
  clientId: string | null;
}

/** Respuesta de /auth/login y de /auth/invitations/:token/accept. */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  /** Segundos de vida del access token (900 = 15 min). */
  expiresIn: number;
  user: SessionUser;
}

/**
 * Respuesta de /auth/refresh.
 * OJO: no incluye `user`, por eso el bootstrap de sesion necesita ademas
 * una llamada a /auth/me.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Datos que se muestran al abrir un enlace de invitacion, antes de aceptarla. */
export interface InvitationPreview {
  email: string;
  name: string;
  role: Role;
}
