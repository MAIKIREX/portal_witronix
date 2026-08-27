"use client";

import { useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { rendersApi } from "../api";
import type { RenderView } from "../types";

/**
 * URL firmada para mostrar un render.
 *
 * Las URLs caducan en 300 s, asi que NO se guardan en ningun estado global ni
 * se pasan por next/image (el optimizador las cachearia y acabaria sirviendo
 * un enlace muerto). Se piden al montar y se pueden renovar con `refetch`
 * cuando la imagen falla al cargar.
 *
 * `versionId` opcional: sin el se muestra la version actual.
 *
 * `enabled` (default true): permite no pedir la URL cuando ya se sabe por
 * adelantado que no hara falta, por ejemplo una miniatura de video o de
 * modelo 3D, que nunca tienen thumbnailUrl y se pintan con un icono fijo.
 */
export function useRenderView(
  renderId: string,
  versionId?: string,
  enabled = true,
) {
  const result = useApi<RenderView>(
    (signal) =>
      versionId
        ? rendersApi.viewVersion(renderId, versionId, signal)
        : rendersApi.view(renderId, signal),
    [renderId, versionId],
    { keepPreviousData: true, enabled },
  );

  /** Para reintentar cuando la imagen no carga (URL caducada). */
  const renew = useCallback(() => {
    void result.refetch();
  }, [result]);

  return { ...result, renew };
}
