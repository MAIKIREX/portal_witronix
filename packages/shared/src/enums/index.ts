/**
 * Enums de dominio del Portal Witronix.
 *
 * Fuente unica de verdad: estos valores se replican en schema.prisma
 * (Prisma no puede importar TypeScript) y los consumen tanto la API
 * como el frontend. Si cambias uno aqui, cambialo tambien alli.
 */

/** Rol global del usuario en el sistema. Seccion 3 del documento de planificacion. */
export const Role = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  CLIENT: 'CLIENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Estado del proyecto. Valores tomados del dashboard interno, seccion 24. */
export const ProjectStatus = {
  POR_INICIAR: 'POR_INICIAR',
  EN_DISENO: 'EN_DISENO',
  ESPERANDO_CLIENTE: 'ESPERANDO_CLIENTE',
  APROBADO: 'APROBADO',
  EN_INSTALACION: 'EN_INSTALACION',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

/** Rol del usuario dentro de un proyecto concreto. */
export const ProjectRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  COLLABORATOR: 'COLLABORATOR',
  VIEWER: 'VIEWER',
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

/** Categorias de la biblioteca documental. Seccion 19. */
export const FileCategory = {
  RENDER: 'RENDER',
  PLANO: 'PLANO',
  FICHA_TECNICA: 'FICHA_TECNICA',
  CERTIFICACION: 'CERTIFICACION',
  COTIZACION: 'COTIZACION',
  CONTRATO: 'CONTRATO',
  MANUAL: 'MANUAL',
  VIDEO: 'VIDEO',
  OTRO: 'OTRO',
} as const;
export type FileCategory = (typeof FileCategory)[keyof typeof FileCategory];

/** Tipos de render. Seccion 6. */
export const RenderType = {
  INTERIOR: 'INTERIOR',
  EXTERIOR: 'EXTERIOR',
  NOCTURNO: 'NOCTURNO',
  ALTERNATIVA: 'ALTERNATIVA',
  ANTES_DESPUES: 'ANTES_DESPUES',
  VIDEO: 'VIDEO',
  RECORRIDO_3D: 'RECORRIDO_3D',
  PANORAMA_360: 'PANORAMA_360',
} as const;
export type RenderType = (typeof RenderType)[keyof typeof RenderType];

/** Estados del flujo de aprobacion. Seccion 7. */
export const ApprovalStatus = {
  PENDIENTE: 'PENDIENTE',
  EN_REVISION: 'EN_REVISION',
  CAMBIOS_SOLICITADOS: 'CAMBIOS_SOLICITADOS',
  NUEVA_VERSION: 'NUEVA_VERSION',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/** Entidad a la que apunta un comentario, aprobacion, notificacion o log. */
export const TargetType = {
  PROJECT: 'PROJECT',
  PROJECT_FILE: 'PROJECT_FILE',
  FILE_VERSION: 'FILE_VERSION',
  RENDER: 'RENDER',
  RENDER_VERSION: 'RENDER_VERSION',
  COMMENT: 'COMMENT',
} as const;
export type TargetType = (typeof TargetType)[keyof typeof TargetType];

/** Estado de subida de una version. Ver nota sobre presigned URLs. */
export const UploadStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type UploadStatus = (typeof UploadStatus)[keyof typeof UploadStatus];

/** Tipos de notificacion. Seccion 17. */
export const NotificationType = {
  NUEVO_ARCHIVO: 'NUEVO_ARCHIVO',
  NUEVO_RENDER: 'NUEVO_RENDER',
  NUEVA_VERSION: 'NUEVA_VERSION',
  NUEVO_COMENTARIO: 'NUEVO_COMENTARIO',
  RESPUESTA_COMENTARIO: 'RESPUESTA_COMENTARIO',
  APROBACION_PENDIENTE: 'APROBACION_PENDIENTE',
  APROBACION_RESUELTA: 'APROBACION_RESUELTA',
  CAMBIOS_SOLICITADOS: 'CAMBIOS_SOLICITADOS',
  MIEMBRO_AGREGADO: 'MIEMBRO_AGREGADO',
  INVITACION: 'INVITACION',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
