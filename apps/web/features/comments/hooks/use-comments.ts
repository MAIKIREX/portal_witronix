"use client";

import type { TargetType } from "@witronix/shared";
import { useApi } from "@/hooks/use-api";
import type { Paginated } from "@/types/api";
import { commentsApi } from "../api";
import type { CommentThread } from "../types";

/**
 * Hilos de comentarios de un proyecto, opcionalmente acotados a un objetivo
 * (por ejemplo, la version de render que se esta viendo).
 */
export function useComments({
  projectId,
  targetType,
  targetId,
  unresolved,
}: {
  projectId: string;
  targetType?: TargetType;
  targetId?: string;
  /** OJO: si es false debe ir sin definir, nunca como false. */
  unresolved?: boolean;
}) {
  return useApi<Paginated<CommentThread>>(
    (signal) =>
      commentsApi.list(
        projectId,
        {
          targetType,
          targetId,
          // `buildParams` ya omite los booleanos en false, pero se deja
          // explicito porque el backend interpretaria `false` como true.
          unresolved: unresolved || undefined,
          limit: 100,
        },
        signal,
      ),
    [projectId, targetType, targetId, unresolved],
    { enabled: Boolean(projectId), keepPreviousData: true },
  );
}
