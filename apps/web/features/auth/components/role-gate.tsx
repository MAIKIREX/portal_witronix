"use client";

import type { Role } from "@witronix/shared";
import { useSessionStore } from "../store";

/**
 * Muestra el contenido solo si el usuario tiene uno de los roles indicados.
 *
 * Igual que usePermissions: es UX, no seguridad. Sirve para no enseñar botones
 * que darian 403.
 */
export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: readonly Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const role = useSessionStore((s) => s.user?.role);
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
