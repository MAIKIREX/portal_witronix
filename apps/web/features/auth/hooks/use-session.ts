"use client";

import { useSessionStore } from "../store";
import type { SessionUser } from "../types";

/** Estado completo de la sesion. */
export function useSession() {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);

  return {
    status,
    user,
    isAuthenticated: status === "authenticated",
    isHydrating: status === "hydrating",
  };
}

/**
 * Usuario actual, dando por hecho que hay sesion.
 * Solo se puede usar dentro del arbol protegido por <AuthGuard>, que garantiza
 * que no se renderiza nada hasta que hay usuario.
 */
export function useCurrentUser(): SessionUser {
  const user = useSessionStore((s) => s.user);
  if (!user) {
    throw new Error(
      "useCurrentUser() se ha usado fuera de <AuthGuard>: no hay sesion.",
    );
  }
  return user;
}
