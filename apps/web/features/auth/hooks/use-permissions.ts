"use client";

import { Role } from "@witronix/shared";
import { useSessionStore } from "../store";

/**
 * Permisos derivados del rol global, replicando los @Roles() del backend.
 *
 * IMPORTANTE: esto es solo para la interfaz (ocultar botones que darian 403).
 * NO es seguridad: el unico guardian real es NestJS. Nunca asumas que porque
 * aqui este oculto, la accion es imposible.
 */
export function usePermissions() {
  const user = useSessionStore((s) => s.user);
  const role = user?.role;

  const isAdmin = role === Role.ADMIN;
  const isProjectManager = role === Role.PROJECT_MANAGER;
  const isTechnician = role === Role.TECHNICIAN;
  const isClient = role === Role.CLIENT;

  /** Equipo de Witronix (todo lo que no es cliente). */
  const isStaff = isAdmin || isProjectManager || isTechnician;

  return {
    role,
    isAdmin,
    isProjectManager,
    isTechnician,
    isClient,
    isStaff,

    // --- Proyectos ---
    /** @Roles(ADMIN, PROJECT_MANAGER) */
    canCreateProject: isAdmin || isProjectManager,
    canChangeProjectStatus: isAdmin || isProjectManager,
    canArchiveProject: isAdmin || isProjectManager,
    canManageMembers: isAdmin || isProjectManager,
    /** @Roles(ADMIN, PROJECT_MANAGER, TECHNICIAN) */
    canEditProject: isStaff,
    canUpdateProgress: isStaff,

    // --- Archivos y renders ---
    /** @Roles(ADMIN, PROJECT_MANAGER, TECHNICIAN) */
    canUpload: isStaff,
    /** @Roles(ADMIN, PROJECT_MANAGER) */
    canDeleteContent: isAdmin || isProjectManager,

    // --- Comentarios ---
    /** Un CLIENT no puede marcar un comentario como interno (el backend lo
     *  fuerza a false aunque se envie true). */
    canWriteInternalComments: isStaff,

    // --- Aprobaciones ---
    /** @Roles(ADMIN, PROJECT_MANAGER, TECHNICIAN) */
    canRequestApproval: isStaff,
    canSubmitNewVersion: isStaff,

    // --- Administracion (fase 2) ---
    canManageClients: isAdmin || isProjectManager,
    canInviteUsers: isAdmin || isProjectManager,
  };
}
