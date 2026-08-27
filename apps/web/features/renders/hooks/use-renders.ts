"use client";

import { useApi } from "@/hooks/use-api";
import type { Paginated } from "@/types/api";
import { rendersApi } from "../api";
import type { RenderDetail, RenderListItem } from "../types";

export function useRenders(projectId: string) {
  return useApi<Paginated<RenderListItem>>(
    (signal) => rendersApi.list(projectId, {}, signal),
    [projectId],
  );
}

export function useRender(renderId: string) {
  return useApi<RenderDetail>(
    (signal) => rendersApi.detail(renderId, signal),
    [renderId],
  );
}
