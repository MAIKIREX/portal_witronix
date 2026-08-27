"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { ApprovalStatusBadge } from "@/components/common/status-badge";
import { useApi } from "@/hooks/use-api";
import { formatRelative } from "@/lib/format";
import type { Paginated } from "@/types/api";
import { approvalsApi } from "../api";
import type { ApprovalListItem } from "../types";

/** Etiqueta legible del objeto sobre el que se pide la aprobacion. */
const TARGET_LABELS: Record<string, string> = {
  RENDER: "Render",
  RENDER_VERSION: "Version de render",
  PROJECT_FILE: "Documento",
  FILE_VERSION: "Version de documento",
  PROJECT: "Proyecto",
  COMMENT: "Comentario",
};

export function ApprovalsList({ projectId }: { projectId: string }) {
  const [onlyPending, setOnlyPending] = useState(false);

  const { data, error, isLoading, refetch } = useApi<
    Paginated<ApprovalListItem>
  >(
    (signal) =>
      approvalsApi.list(
        projectId,
        // `pending` en false debe ir sin definir: el backend lo leeria como true.
        { pending: onlyPending || undefined },
        signal,
      ),
    [projectId, onlyPending],
    { keepPreviousData: true },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          Aprobaciones{data ? ` (${data.meta.total})` : ""}
        </h2>
        <Button
          variant={onlyPending ? "secondary" : "outline"}
          size="sm"
          onClick={() => setOnlyPending((v) => !v)}
          aria-pressed={onlyPending}
        >
          Solo pendientes
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        }
        isEmpty={(d) => d.data.length === 0}
        empty={
          <EmptyState
            icon={ClipboardCheck}
            title={
              onlyPending
                ? "No hay aprobaciones pendientes"
                : "Todavia no hay aprobaciones"
            }
            description={
              onlyPending
                ? "Nada requiere una decision ahora mismo."
                : "Las solicitudes de aprobacion apareceran aqui."
            }
          />
        }
      >
        {(page) => (
          <ul className="space-y-2">
            {page.data.map((approval) => (
              <li key={approval.id}>
                <Link
                  href={`/proyectos/${projectId}/aprobaciones/${approval.id}`}
                  className="hover:border-primary/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {TARGET_LABELS[approval.targetType] ??
                        approval.targetType}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Solicitada por {approval.requestedBy.name} ·{" "}
                      {formatRelative(approval.requestedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {approval._count.events} movimiento
                      {approval._count.events === 1 ? "" : "s"}
                    </span>
                    <ApprovalStatusBadge status={approval.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DataState>
    </div>
  );
}
