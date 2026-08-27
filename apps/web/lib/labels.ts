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
  neutral: "bg-tone-neutral text-tone-neutral-fg",
  info: "bg-tone-info text-tone-info-fg",
  success: "bg-tone-success text-tone-success-fg",
  warning: "bg-tone-warning text-tone-warning-fg",
  danger: "bg-tone-danger text-tone-danger-fg",
  active: "bg-tone-active text-tone-active-fg",
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: "Administrador",
  [Role.PROJECT_MANAGER]: "Jefe de proyecto",
  [Role.TECHNICIAN]: "Tecnico",
  [Role.CLIENT]: "Cliente",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.POR_INICIAR]: "Por iniciar",
  [ProjectStatus.EN_DISENO]: "En diseno",
  [ProjectStatus.ESPERANDO_CLIENTE]: "Esperando al cliente",
  [ProjectStatus.APROBADO]: "Aprobado",
  [ProjectStatus.EN_INSTALACION]: "En instalacion",
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
  [ApprovalStatus.EN_REVISION]: "En revision",
  [ApprovalStatus.CAMBIOS_SOLICITADOS]: "Cambios solicitados",
  [ApprovalStatus.NUEVA_VERSION]: "Nueva version",
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
  [RenderType.ANTES_DESPUES]: "Antes / despues",
  [RenderType.VIDEO]: "Video",
  [RenderType.RECORRIDO_3D]: "Recorrido 3D",
  [RenderType.PANORAMA_360]: "Panorama 360",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.NUEVO_ARCHIVO]: "Documento nuevo",
  [NotificationType.NUEVO_RENDER]: "Render nuevo",
  [NotificationType.NUEVA_VERSION]: "Version nueva",
  [NotificationType.NUEVO_COMENTARIO]: "Comentario nuevo",
  [NotificationType.RESPUESTA_COMENTARIO]: "Respuesta a tu comentario",
  [NotificationType.APROBACION_PENDIENTE]: "Aprobacion pendiente",
  [NotificationType.APROBACION_RESUELTA]: "Aprobacion resuelta",
  [NotificationType.CAMBIOS_SOLICITADOS]: "Cambios solicitados",
  [NotificationType.MIEMBRO_AGREGADO]: "Te han anadido a un proyecto",
  [NotificationType.INVITACION]: "Invitacion",
};

/** Tono del punto que acompana a cada tipo de notificacion. */
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
  [FileCategory.FICHA_TECNICA]: "Ficha tecnica",
  [FileCategory.CERTIFICACION]: "Certificacion",
  [FileCategory.COTIZACION]: "Cotizacion",
  [FileCategory.CONTRATO]: "Contrato",
  [FileCategory.MANUAL]: "Manual",
  [FileCategory.VIDEO]: "Video",
  [FileCategory.OTRO]: "Otro",
};
