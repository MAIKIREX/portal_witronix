import { ApprovalStatus } from './index';

/**
 * Maquina de estados de aprobacion (seccion 7 del documento).
 *
 *   PENDIENTE -> EN_REVISION -> CAMBIOS_SOLICITADOS -> NUEVA_VERSION -> APROBADO
 *
 * Se define aqui, y no como un campo libre en la BD, para que la API rechace
 * transiciones invalidas y el frontend sepa que acciones ofrecer sin duplicar
 * las reglas. Las dos partes leen exactamente el mismo mapa.
 */
export const APPROVAL_TRANSITIONS: Record<ApprovalStatus, readonly ApprovalStatus[]> = {
  PENDIENTE: ['EN_REVISION', 'APROBADO', 'CAMBIOS_SOLICITADOS', 'RECHAZADO'],
  EN_REVISION: ['APROBADO', 'CAMBIOS_SOLICITADOS', 'RECHAZADO'],
  CAMBIOS_SOLICITADOS: ['NUEVA_VERSION', 'RECHAZADO'],
  NUEVA_VERSION: ['EN_REVISION', 'APROBADO', 'CAMBIOS_SOLICITADOS'],
  // Estados terminales: una aprobacion cerrada no se reabre. Si hace falta
  // otra decision, se crea una aprobacion nueva sobre la nueva version.
  APROBADO: [],
  RECHAZADO: [],
} as const;

export function canTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return APPROVAL_TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: ApprovalStatus): boolean {
  return APPROVAL_TRANSITIONS[status].length === 0;
}

/** Estados de proyecto que cuentan como "activo" en los contadores del dashboard. */
export const ACTIVE_PROJECT_STATUSES = [
  'POR_INICIAR',
  'EN_DISENO',
  'ESPERANDO_CLIENTE',
  'APROBADO',
  'EN_INSTALACION',
] as const;
