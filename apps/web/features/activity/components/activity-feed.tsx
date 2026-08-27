"use client";

import { History } from "lucide-react";
import { api, buildParams } from "@/lib/http";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import { formatDateTime, initials } from "@/lib/format";
import type { Paginated, UserRef } from "@/types/api";

interface ActivityLog {
  id: string;
  projectId: string;
  actorId: string | null;
  /** Codigo de la accion, ej. "render.version.published". */
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  metadata: unknown;
  createdAt: string;
  actor: UserRef | null;
}

/**
 * Traduccion de los codigos de accion que emite el backend.
 * Si aparece uno nuevo sin traducir se muestra el codigo tal cual, que es
 * feo pero informativo, en lugar de una cadena vacia.
 */
const ACTION_LABELS: Record<string, string> = {
  "file.version.published": "publico una version de un documento",
  "render.version.published": "publico una version de un render",
  "comment.created": "escribio un comentario",
  "comment.replied": "respondio a un comentario",
  "approval.requested": "solicito una aprobacion",
  "approval.aprobado": "aprobo una propuesta",
  "approval.rechazado": "rechazo una propuesta",
  "approval.en_revision": "empezo a revisar una propuesta",
  "approval.cambios_solicitados": "solicito cambios",
  "approval.nueva_version": "marco una nueva version",
  "project.member.added": "anadio a alguien al proyecto",
};

export function ActivityFeed({ projectId }: { projectId: string }) {
  const { data, error, isLoading, refetch } = useApi<Paginated<ActivityLog>>(
    (signal) =>
      api
        .get<Paginated<ActivityLog>>(`/projects/${projectId}/activity`, {
          params: buildParams({ limit: 50 }),
          signal,
        })
        .then((r) => r.data),
    [projectId],
  );

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      }
      isEmpty={(d) => d.data.length === 0}
      empty={
        <EmptyState
          icon={History}
          title="Sin actividad todavia"
          description="Aqui se ira registrando lo que ocurra en el proyecto."
        />
      }
    >
      {(page) => (
        <ol className="space-y-3">
          {page.data.map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <span
                className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
                aria-hidden="true"
              >
                {entry.actor ? initials(entry.actor.name) : "··"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {entry.actor?.name ?? "El sistema"}
                  </span>{" "}
                  {ACTION_LABELS[entry.action] ?? entry.action}
                  {entry.targetLabel && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {entry.targetLabel}
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DataState>
  );
}
