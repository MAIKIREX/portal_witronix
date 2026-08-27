import type { ApprovalStatus, RenderType, UploadStatus } from "@witronix/shared";
import type { PaginationQuery, UserRef } from "@/types/api";

export interface RenderVersion {
  id: string;
  renderId: string;
  version: number;
  storageKey: string;
  thumbnailKey: string | null;
  originalName: string;
  mimeType: string;
  /**
   * OJO: llega como STRING, no como numero. El backend sobrescribe
   * BigInt.prototype.toJSON, asi que sumarlo concatena. Usa formatBytes().
   */
  sizeBytes: string;
  width: number | null;
  height: number | null;
  status: ApprovalStatus;
  notes: string | null;
  uploadedById: string;
  uploadStatus: UploadStatus;
  createdAt: string;
}

export interface RenderVersionWithAuthor extends RenderVersion {
  uploadedBy: UserRef;
}

export interface Render {
  id: string;
  projectId: string;
  title: string;
  area: string | null;
  type: RenderType;
  description: string | null;
  currentVersionId: string | null;
  isVisibleToClient: boolean;
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Elemento del listado: la version actual viene resumida. */
export interface RenderListItem extends Render {
  createdBy: UserRef;
  currentVersion: Pick<
    RenderVersion,
    | "id"
    | "version"
    | "status"
    | "thumbnailKey"
    | "width"
    | "height"
    | "createdAt"
    | "mimeType"
  > | null;
  _count: { versions: number };
}

export interface RenderDetail extends Render {
  createdBy: UserRef;
  currentVersion: RenderVersion | null;
  /** Solo versiones COMPLETED, ordenadas de la mas reciente a la mas antigua. */
  versions: RenderVersionWithAuthor[];
}

/** Respuesta de /renders/:id/view y de la vista de una version concreta. */
export interface RenderView {
  /** URL firmada. Caduca en `expiresIn` segundos: no la guardes en el estado. */
  url: string;
  thumbnailUrl: string | null;
  version: number;
  status: ApprovalStatus;
  width: number | null;
  height: number | null;
  sizeBytes: string;
  expiresIn: number;
}

/** Paso 1 del flujo de subida: lo que hace falta para el PUT a MinIO. */
export interface UploadIntent {
  versionId: string;
  version: number;
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
  /**
   * Cabeceras OBLIGATORIAS del PUT. Se envian tal cual: el Content-Type forma
   * parte de la firma y cualquier diferencia hace que MinIO devuelva 403.
   */
  requiredHeaders: Record<string, string>;
}

export interface CreateRenderResult {
  render: Render;
  upload: UploadIntent;
}

export interface RenderQuery extends PaginationQuery {
  type?: RenderType;
}

/** Datos del formulario de subida (paso 1). */
export interface CreateRenderInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  title: string;
  area?: string;
  type?: RenderType;
  description?: string;
  notes?: string;
  isVisibleToClient?: boolean;
}
