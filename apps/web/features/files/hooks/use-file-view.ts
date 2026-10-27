"use client";

import { useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { filesApi } from "../api";
import type { FileView } from "../types";

/**
 * URL firmada inline para previsualizar un documento o plano.
 *
 * Las URLs caducan en 300 s, por lo que se piden al montar la vista y se
 * pueden renovar con `renew()` si expiran durante una sesión prolongada.
 *
 * `versionId` opcional: si no se especifica, carga la versión actual.
 */
export function useFileView(
  fileId: string,
  versionId?: string,
  enabled = true,
) {
  const result = useApi<FileView>(
    (signal) =>
      versionId
        ? filesApi.viewVersion(fileId, versionId, signal)
        : filesApi.view(fileId, signal),
    [fileId, versionId],
    { keepPreviousData: true, enabled },
  );

  const renew = useCallback(() => {
    void result.refetch();
  }, [result]);

  return { ...result, renew };
}
