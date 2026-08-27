import { api, buildParams } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type { UploadIntent } from "@/features/renders/types";
import type {
  CreateFileInput,
  CreateFileResult,
  FileDetail,
  FileDownload,
  FileListItem,
  FileQuery,
  FileVersion,
} from "./types";

/**
 * Biblioteca documental.
 *
 * El flujo de subida es EL MISMO que el de renders (intento -> PUT a MinIO ->
 * confirmacion), asi que se reutiliza `rendersApi.upload` para el paso 2: el
 * PUT no depende del tipo de recurso, solo de la URL firmada.
 */
export const filesApi = {
  list(
    projectId: string,
    query: FileQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<FileListItem>> {
    return api
      .get<Paginated<FileListItem>>(`/projects/${projectId}/files`, {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  detail(fileId: string, signal?: AbortSignal): Promise<FileDetail> {
    return api
      .get<FileDetail>(`/files/${fileId}`, { signal })
      .then((r) => r.data);
  },

  /** URL firmada de la version actual. Caduca en 300 s: pidela al usarla. */
  download(fileId: string, signal?: AbortSignal): Promise<FileDownload> {
    return api
      .get<FileDownload>(`/files/${fileId}/download`, { signal })
      .then((r) => r.data);
  },

  downloadVersion(
    fileId: string,
    versionId: string,
    signal?: AbortSignal,
  ): Promise<FileDownload> {
    return api
      .get<FileDownload>(`/files/${fileId}/versions/${versionId}/download`, {
        signal,
      })
      .then((r) => r.data);
  },

  create(
    projectId: string,
    input: CreateFileInput,
  ): Promise<CreateFileResult> {
    return api
      .post<CreateFileResult>(`/projects/${projectId}/files`, input)
      .then((r) => r.data);
  },

  uploadIntent(
    fileId: string,
    input: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      notes?: string;
    },
  ): Promise<UploadIntent> {
    return api
      .post<UploadIntent>(`/files/${fileId}/versions/upload-intent`, input)
      .then((r) => r.data);
  },

  confirm(
    fileId: string,
    versionId: string,
    checksum?: string,
  ): Promise<FileVersion> {
    return api
      .post<FileVersion>(
        `/files/${fileId}/versions/${versionId}/confirm`,
        checksum ? { checksum } : {},
      )
      .then((r) => r.data);
  },

  remove(fileId: string): Promise<void> {
    return api.delete(`/files/${fileId}`).then(() => undefined);
  },
};
