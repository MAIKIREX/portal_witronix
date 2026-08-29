"use client";

import { useCallback, useRef, useState } from "react";
import { sileo } from "sileo";
import { isApiError, normalizeApiError, type ApiError } from "@/lib/http";
import { rendersApi } from "../api";
import type { CreateRenderInput, RenderVersion } from "../types";

export type UploadPhase =
  | "idle"
  | "creating" // paso 1: reservar version y pedir URL firmada
  | "uploading" // paso 2: PUT a MinIO
  | "confirming" // paso 3: confirmar contra el backend
  | "done"
  | "error";

interface UploadState {
  phase: UploadPhase;
  /** 0-100. Solo tiene sentido durante la fase "uploading". */
  progress: number;
  error: ApiError | null;
}

const INITIAL: UploadState = { phase: "idle", progress: 0, error: null };

/**
 * Subida de renders en tres pasos.
 *
 * 1. POST al backend -> reserva la version y devuelve una URL firmada.
 * 2. PUT del binario directamente a MinIO (el backend no ve el fichero).
 * 3. POST de confirmacion -> el backend comprueba el objeto y lo da por bueno.
 *
 * Si el paso 3 no llega a ejecutarse, la version queda en PENDING y un proceso
 * programado la limpia, asi que un fallo a medias no deja basura permanente.
 */
function resolveUploadMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "glb") return "model/gltf-binary";
  if (ext === "gltf") return "model/gltf+json";
  return file.type || "application/octet-stream";
}

export function useRenderUpload() {
  const [state, setState] = useState<UploadState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => setState(INITIAL), []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setState(INITIAL);
  }, []);

  /**
   * Ejecuta los pasos 2 y 3, comunes tanto a un render nuevo como a una
   * version nueva de uno existente.
   */
  const runUpload = useCallback(
    async (
      renderId: string,
      intent: Awaited<ReturnType<typeof rendersApi.uploadIntent>>,
      file: File,
    ): Promise<RenderVersion> => {
      const controller = new AbortController();
      controllerRef.current = controller;

      setState({ phase: "uploading", progress: 0, error: null });
      await rendersApi.upload(
        intent,
        file,
        (percent) =>
          setState((s) => ({ ...s, phase: "uploading", progress: percent })),
        controller.signal,
      );

      setState((s) => ({ ...s, phase: "confirming", progress: 100 }));
      return rendersApi.confirm(renderId, intent.versionId);
    },
    [],
  );

  /** Render nuevo (version 1). */
  const createRender = useCallback(
    async (
      projectId: string,
      file: File,
      input: Omit<CreateRenderInput, "filename" | "mimeType" | "sizeBytes">,
    ): Promise<{ renderId: string } | null> => {
      try {
        setState({ phase: "creating", progress: 0, error: null });
        const { render, upload } = await rendersApi.create(projectId, {
          ...input,
          filename: file.name,
          // Algunos formatos tecnicos (.glb, .dwg, .ies...) llegan con el
          // tipo vacio desde el selector de archivos, segun el sistema
          // operativo y el navegador. El backend admite
          // application/octet-stream siempre que la extension este en su
          // lista de extensiones tecnicas (ver TECHNICAL_EXTENSIONS);
          // mandar "" tal cual seria "Tipo de archivo no permitido: ".
          mimeType: resolveUploadMimeType(file),
          sizeBytes: file.size,
        });

        await runUpload(render.id, upload, file);
        setState({ phase: "done", progress: 100, error: null });
        sileo.success({ title: "Render subido" });
        return { renderId: render.id };
      } catch (caught) {
        handleFailure(caught, setState);
        return null;
      }
    },
    [runUpload],
  );

  /** Version nueva de un render que ya existe. */
  const addVersion = useCallback(
    async (
      renderId: string,
      file: File,
      notes?: string,
    ): Promise<RenderVersion | null> => {
      try {
        setState({ phase: "creating", progress: 0, error: null });
        const intent = await rendersApi.uploadIntent(renderId, {
          filename: file.name,
          // Algunos formatos tecnicos (.glb, .dwg, .ies...) llegan con el
          // tipo vacio desde el selector de archivos, segun el sistema
          // operativo y el navegador. El backend admite
          // application/octet-stream siempre que la extension este en su
          // lista de extensiones tecnicas (ver TECHNICAL_EXTENSIONS);
          // mandar "" tal cual seria "Tipo de archivo no permitido: ".
          mimeType: resolveUploadMimeType(file),
          sizeBytes: file.size,
          notes,
        });

        const version = await runUpload(renderId, intent, file);
        setState({ phase: "done", progress: 100, error: null });
        sileo.success({ title: `Version ${version.version} subida` });
        return version;
      } catch (caught) {
        handleFailure(caught, setState);
        return null;
      }
    },
    [runUpload],
  );

  return { ...state, createRender, addVersion, reset, cancel };
}

function handleFailure(
  caught: unknown,
  setState: (s: UploadState) => void,
): void {
  // Una cancelacion del usuario no es un fallo que haya que anunciar.
  if (caught instanceof Error && caught.name === "CanceledError") {
    setState(INITIAL);
    return;
  }

  const error = isApiError(caught) ? caught : normalizeApiError(caught);

  // El PUT va contra MinIO, no contra la API, asi que su error no trae el
  // formato del backend. El 403 casi siempre significa lo mismo.
  const message =
    error.status === 403
      ? "El almacenamiento rechazo la subida. Vuelve a intentarlo."
      : error.message;

  setState({ phase: "error", progress: 0, error: { ...error, message } });
  sileo.error({ title: "No se pudo subir el archivo", description: message });
}
