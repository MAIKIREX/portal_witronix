import { api, buildParams, storage } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type {
  CreateRenderInput,
  CreateRenderResult,
  RenderDetail,
  RenderListItem,
  RenderQuery,
  RenderVersion,
  RenderView,
  UploadIntent,
} from "./types";

export const rendersApi = {
  list(
    projectId: string,
    query: RenderQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<RenderListItem>> {
    return api
      .get<Paginated<RenderListItem>>(`/projects/${projectId}/renders`, {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  detail(renderId: string, signal?: AbortSignal): Promise<RenderDetail> {
    return api
      .get<RenderDetail>(`/renders/${renderId}`, { signal })
      .then((r) => r.data);
  },

  /**
   * URL firmada de la version actual. Caduca en 300 s, asi que se pide justo
   * antes de usarla y NUNCA se guarda en el estado global.
   */
  view(renderId: string, signal?: AbortSignal): Promise<RenderView> {
    return api
      .get<RenderView>(`/renders/${renderId}/view`, { signal })
      .then((r) => r.data);
  },

  viewVersion(
    renderId: string,
    versionId: string,
    signal?: AbortSignal,
  ): Promise<RenderView> {
    return api
      .get<RenderView>(`/renders/${renderId}/versions/${versionId}/view`, {
        signal,
      })
      .then((r) => r.data);
  },

  // ------------------------------------------------------------------
  //  Subida en 3 pasos
  // ------------------------------------------------------------------

  /** Paso 1a: crear un render nuevo y obtener la URL firmada de su version 1. */
  create(
    projectId: string,
    input: CreateRenderInput,
  ): Promise<CreateRenderResult> {
    return api
      .post<CreateRenderResult>(`/projects/${projectId}/renders`, input)
      .then((r) => r.data);
  },

  /** Paso 1b: version nueva de un render existente. Devuelve solo el intento. */
  uploadIntent(
    renderId: string,
    input: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      notes?: string;
    },
  ): Promise<UploadIntent> {
    return api
      .post<UploadIntent>(`/renders/${renderId}/versions/upload-intent`, input)
      .then((r) => r.data);
  },

  /**
   * Paso 2: PUT del binario directamente a MinIO. El backend no ve el fichero.
   *
   * Detalles que no se pueden cambiar:
   *  - Metodo PUT y el File CRUDO como cuerpo. Nada de FormData ni multipart.
   *  - Las cabeceras van tal cual vienen del paso 1: el Content-Type forma
   *    parte de la firma y cualquier diferencia produce un 403 de MinIO.
   *  - Sin Authorization: la firma viaja en la query string y mandar el Bearer
   *    hace que MinIO rechace la peticion.
   */
  upload(
    intent: UploadIntent,
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return storage
      .put(intent.uploadUrl, file, {
        headers: intent.requiredHeaders,
        signal,
        // `fetch` no informa del progreso de subida; axios si, sobre XHR.
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then(() => undefined);
  },

  /**
   * Paso 3: confirmar. El backend hace HeadObject y se queda con el tamano y
   * el tipo REALES, no con los declarados. Sin este paso la version queda en
   * PENDING y un proceso programado acaba borrandola.
   */
  confirm(
    renderId: string,
    versionId: string,
    checksum?: string,
  ): Promise<RenderVersion> {
    return api
      .post<RenderVersion>(
        `/renders/${renderId}/versions/${versionId}/confirm`,
        checksum ? { checksum } : {},
      )
      .then((r) => r.data);
  },

  remove(renderId: string): Promise<void> {
    return api.delete(`/renders/${renderId}`).then(() => undefined);
  },
};
