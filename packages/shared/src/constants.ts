/** Limites y tipos MIME aceptados. Los valida la API antes de firmar la URL de subida. */

export const MIME_GROUPS = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  // Formatos propios del sector: fotometria (IES/LDT), CAD y BIM.
  TECHNICAL: [
    'application/octet-stream',
    'image/vnd.dwg',
    'application/acad',
    'model/gltf-binary',
    'model/gltf+json',
  ],
  ARCHIVE: ['application/zip', 'application/x-7z-compressed', 'application/x-rar-compressed'],
} as const;

export const ALLOWED_MIME_TYPES: readonly string[] = [
  ...MIME_GROUPS.IMAGE,
  ...MIME_GROUPS.VIDEO,
  ...MIME_GROUPS.DOCUMENT,
  ...MIME_GROUPS.TECHNICAL,
  ...MIME_GROUPS.ARCHIVE,
];

/** Extensiones tecnicas que suelen llegar como application/octet-stream. */
export const TECHNICAL_EXTENSIONS = [
  'ies', 'ldt', 'dwg', 'dxf', 'rvt', 'ifc', 'step', 'stp', 'glb', 'gltf', 'skp',
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Codigo legible de proyecto: PRY-2026-001 */
export const PROJECT_CODE_PREFIX = 'PRY';
