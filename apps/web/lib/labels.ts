import {
  ApprovalStatus,
  FileCategory,
  NotificationType,
  ProjectRole,
  ProjectStatus,
  RenderType,
  Role,
} from "@witronix/shared";

/**
 * Traduccion de los enums de dominio a etiquetas y colores.
 *
 * Punto unico: el color de cada estado se decide aqui y en las variables
 * --tone-* de globals.css. No pongas colores de estado sueltos en componentes.
 */

/** Clases de los tonos definidos en globals.css. */
export type Tone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "active";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral:
    "bg-gradient-to-r from-slate-700 to-slate-800 text-slate-100 border border-slate-500/40 shadow-xs shadow-slate-950/20",
  info:
    "bg-gradient-to-r from-cyan-600 to-sky-600 text-cyan-50 border border-cyan-400/40 shadow-xs shadow-cyan-950/25",
  success:
    "bg-gradient-to-r from-emerald-600 to-teal-600 text-emerald-50 border border-emerald-400/40 shadow-xs shadow-emerald-950/25",
  warning:
    "bg-gradient-to-r from-amber-600 to-amber-500 text-amber-50 border border-amber-300/50 shadow-xs shadow-amber-950/25",
  danger:
    "bg-gradient-to-r from-red-600 to-rose-600 text-rose-50 border border-red-400/50 shadow-xs shadow-red-950/30",
  active:
    "bg-gradient-to-r from-indigo-600 to-blue-600 text-indigo-50 border border-indigo-400/40 shadow-xs shadow-indigo-950/25",
};

/** Clases para el punto indicador luminoso de cada tono */
export const TONE_DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-500 shadow-[0_0_6px_rgba(100,116,139,0.5)]",
  info: "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]",
  success: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  warning: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
  danger: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]",
  active: "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]",
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: "Administrador",
  [Role.PROJECT_MANAGER]: "Jefe de proyecto",
  [Role.TECHNICIAN]: "Técnico",
  [Role.CLIENT]: "Cliente",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.POR_INICIAR]: "Por iniciar",
  [ProjectStatus.EN_DISENO]: "En diseño",
  [ProjectStatus.ESPERANDO_CLIENTE]: "Esperando al cliente",
  [ProjectStatus.APROBADO]: "Aprobado",
  [ProjectStatus.EN_INSTALACION]: "En instalación",
  [ProjectStatus.FINALIZADO]: "Finalizado",
  [ProjectStatus.CANCELADO]: "Cancelado",
};

export const PROJECT_STATUS_TONES: Record<ProjectStatus, Tone> = {
  [ProjectStatus.POR_INICIAR]: "neutral",
  [ProjectStatus.EN_DISENO]: "info",
  [ProjectStatus.ESPERANDO_CLIENTE]: "warning",
  [ProjectStatus.APROBADO]: "success",
  [ProjectStatus.EN_INSTALACION]: "active",
  [ProjectStatus.FINALIZADO]: "success",
  [ProjectStatus.CANCELADO]: "danger",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDIENTE]: "Pendiente",
  [ApprovalStatus.EN_REVISION]: "En revisión",
  [ApprovalStatus.CAMBIOS_SOLICITADOS]: "Cambios solicitados",
  [ApprovalStatus.NUEVA_VERSION]: "Nueva versión",
  [ApprovalStatus.APROBADO]: "Aprobado",
  [ApprovalStatus.RECHAZADO]: "Rechazado",
};

export const APPROVAL_STATUS_TONES: Record<ApprovalStatus, Tone> = {
  [ApprovalStatus.PENDIENTE]: "warning",
  [ApprovalStatus.EN_REVISION]: "info",
  [ApprovalStatus.CAMBIOS_SOLICITADOS]: "warning",
  [ApprovalStatus.NUEVA_VERSION]: "active",
  [ApprovalStatus.APROBADO]: "success",
  [ApprovalStatus.RECHAZADO]: "danger",
};

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  [ProjectRole.OWNER]: "Responsable",
  [ProjectRole.MANAGER]: "Gestor",
  [ProjectRole.COLLABORATOR]: "Colaborador",
  [ProjectRole.VIEWER]: "Observador",
};

export const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  [RenderType.INTERIOR]: "Interior",
  [RenderType.EXTERIOR]: "Exterior",
  [RenderType.NOCTURNO]: "Nocturno",
  [RenderType.ALTERNATIVA]: "Alternativa",
  [RenderType.ANTES_DESPUES]: "Antes / después",
  [RenderType.VIDEO]: "Video",
  [RenderType.RECORRIDO_3D]: "Recorrido 3D",
  [RenderType.PANORAMA_360]: "Panorama 360",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.NUEVO_ARCHIVO]: "Documento nuevo",
  [NotificationType.NUEVO_RENDER]: "Render nuevo",
  [NotificationType.NUEVA_VERSION]: "Versión nueva",
  [NotificationType.NUEVO_COMENTARIO]: "Comentario nuevo",
  [NotificationType.RESPUESTA_COMENTARIO]: "Respuesta a tu comentario",
  [NotificationType.APROBACION_PENDIENTE]: "Aprobación pendiente",
  [NotificationType.APROBACION_RESUELTA]: "Aprobación resuelta",
  [NotificationType.CAMBIOS_SOLICITADOS]: "Cambios solicitados",
  [NotificationType.MIEMBRO_AGREGADO]: "Te han añadido a un proyecto",
  [NotificationType.INVITACION]: "Invitación",
};

/** Tono del punto que acompaña a cada tipo de notificación. */
export const NOTIFICATION_TYPE_TONES: Record<NotificationType, Tone> = {
  [NotificationType.NUEVO_ARCHIVO]: "info",
  [NotificationType.NUEVO_RENDER]: "info",
  [NotificationType.NUEVA_VERSION]: "active",
  [NotificationType.NUEVO_COMENTARIO]: "neutral",
  [NotificationType.RESPUESTA_COMENTARIO]: "neutral",
  [NotificationType.APROBACION_PENDIENTE]: "warning",
  [NotificationType.APROBACION_RESUELTA]: "success",
  [NotificationType.CAMBIOS_SOLICITADOS]: "warning",
  [NotificationType.MIEMBRO_AGREGADO]: "info",
  [NotificationType.INVITACION]: "info",
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  [FileCategory.RENDER]: "Render",
  [FileCategory.PLANO]: "Plano",
  [FileCategory.FICHA_TECNICA]: "Ficha técnica",
  [FileCategory.CERTIFICACION]: "Certificación",
  [FileCategory.COTIZACION]: "Cotización",
  [FileCategory.CONTRATO]: "Contrato",
  [FileCategory.MANUAL]: "Manual",
  [FileCategory.VIDEO]: "Video",
  [FileCategory.OTRO]: "Otro",
};
