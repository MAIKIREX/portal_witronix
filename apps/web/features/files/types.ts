import type { FileCategory, UploadStatus } from "@witronix/shared";
import type { PaginationQuery, UserRef } from "@/types/api";
import type { UploadIntent } from "@/features/renders/types";

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  storageKey: string;
  originalName: string;
  mimeType: string;
  /** STRING, no numero (BigInt serializado). Usa formatBytes(). */
  sizeBytes: string;
  checksum: string | null;
  /**
   * A diferencia de RenderVersion, una version de documento NO tiene estado de
   * aprobacion propio: el modelo FileVersion no lleva ese campo. Las
   * aprobaciones de documentos se registran aparte, en la tabla de
   * aprobaciones, apuntando a FILE_VERSION.
   */
  notes: string | null;
  uploadedById: string;
  uploadStatus: UploadStatus;
  createdAt: string;
}

export interface FileVersionWithAuthor extends FileVersion {
  uploadedBy: UserRef;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  category: FileCategory;
  description: string | null;
  currentVersionId: string | null;
  isVisibleToClient: boolean;
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileListItem extends ProjectFile {
  createdBy: UserRef;
  currentVersion: Pick<
    FileVersion,
    "id" | "version" | "originalName" | "mimeType" | "sizeBytes" | "createdAt"
  > | null;
  _count: { versions: number };
}

export interface FileDetail extends ProjectFile {
  createdBy: UserRef;
  currentVersion: FileVersion | null;
  versions: FileVersionWithAuthor[];
}

/** Respuesta de /files/:id/download: URL firmada de descarga. */
export interface FileDownload {
  url: string;
  filename: string;
  version: number;
  sizeBytes: string;
  expiresIn: number;
}

export interface CreateFileResult {
  file: ProjectFile;
  upload: UploadIntent;
}

export interface FileQuery extends PaginationQuery {
  category?: FileCategory;
}

export interface CreateFileInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  name: string;
  category: FileCategory;
  description?: string;
  notes?: string;
  isVisibleToClient?: boolean;
}
