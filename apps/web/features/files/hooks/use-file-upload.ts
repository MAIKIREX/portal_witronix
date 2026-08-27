"use client";

import { useCallback, useRef, useState } from "react";
import { sileo } from "sileo";
import { isApiError, normalizeApiError, type ApiError } from "@/lib/http";
import { rendersApi } from "@/features/renders/api";
import type { UploadIntent } from "@/features/renders/types";
import { filesApi } from "../api";
import type { CreateFileInput, FileVersion } from "../types";

export type UploadPhase =
  | "idle"
  | "creating"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

interface UploadState {
  phase: UploadPhase;
  progress: number;
  error: ApiError | null;
}

const INITIAL: UploadState = { phase: "idle", progress: 0, error: null };

/**
 * Subida de documentos. Mismo flujo de tres pasos que los renders; el paso 2
 * (PUT del binario) se reutiliza tal cual porque solo depende de la URL
 * firmada, no del tipo de recurso.
 */
export function useFileUpload() {
  const [state, setState] = useState<UploadState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => setState(INITIAL), []);
  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setState(INITIAL);
  }, []);

  const runUpload = useCallback(
    async (
      fileId: string,
      intent: UploadIntent,
      file: File,
    ): Promise<FileVersion> => {
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
      return filesApi.confirm(fileId, intent.versionId);
    },
    [],
  );

  const createFile = useCallback(
    async (
      projectId: string,
      file: File,
      input: Omit<CreateFileInput, "filename" | "mimeType" | "sizeBytes">,
    ): Promise<{ fileId: string } | null> => {
      try {
        setState({ phase: "creating", progress: 0, error: null });
        const { file: created, upload } = await filesApi.create(projectId, {
          ...input,
          filename: file.name,
          // Algunos tipos tecnicos (.ies, .dwg) llegan con el tipo vacio desde
          // el navegador. El backend admite application/octet-stream siempre
          // que la extension este en su lista de extensiones tecnicas.
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });

        await runUpload(created.id, upload, file);
        setState({ phase: "done", progress: 100, error: null });
        sileo.success({ title: "Documento subido" });
        return { fileId: created.id };
      } catch (caught) {
        handleFailure(caught, setState);
        return null;
      }
    },
    [runUpload],
  );

  const addVersion = useCallback(
    async (
      fileId: string,
      file: File,
      notes?: string,
    ): Promise<FileVersion | null> => {
      try {
        setState({ phase: "creating", progress: 0, error: null });
        const intent = await filesApi.uploadIntent(fileId, {
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          notes,
        });

        const version = await runUpload(fileId, intent, file);
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

  return { ...state, createFile, addVersion, reset, cancel };
}

function handleFailure(
  caught: unknown,
  setState: (s: UploadState) => void,
): void {
  if (caught instanceof Error && caught.name === "CanceledError") {
    setState(INITIAL);
    return;
  }

  const error = isApiError(caught) ? caught : normalizeApiError(caught);
  const message =
    error.status === 403
      ? "El almacenamiento rechazo la subida. Vuelve a intentarlo."
      : error.message;

  setState({ phase: "error", progress: 0, error: { ...error, message } });
  sileo.error({ title: "No se pudo subir el archivo", description: message });
}
