"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, ClipboardCheck, FileText, ImageIcon, MessageSquare } from "lucide-react";
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
  RENDER_VERSION: "Render 3D",
  PROJECT_FILE: "Documento",
  FILE_VERSION: "Documento técnico",
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
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
                : "Las solicitudes de aprobacion apareceran aqui cuando se requiera tu visto bueno."
            }
          />
        }
      >
        {(page) => (
          <ul className="space-y-3">
            {page.data.map((approval) => {
              const target = approval.target;
              const title =
                target?.title ??
                approval.targetLabel ??
                TARGET_LABELS[approval.targetType] ??
                approval.targetType;
              const typeLabel =
                TARGET_LABELS[approval.targetType] ?? approval.targetType;
              const version = target?.version;
              const area = target?.area;
              const category = target?.category;
              const thumbnail = target?.thumbnailUrl;

              return (
                <li key={approval.id}>
                  <Link
                    href={`/proyectos/${projectId}/aprobaciones/${approval.id}`}
                    className="group hover:border-primary/50 hover:bg-muted/30 flex flex-col gap-3 rounded-lg border p-3.5 transition-all sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Miniatura / Icono */}
                      <div className="bg-muted relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnail}
                            alt={title}
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : approval.targetType === "RENDER_VERSION" ||
                          approval.targetType === "RENDER" ? (
                          <ImageIcon className="text-muted-foreground size-6" />
                        ) : (
                          <FileText className="text-muted-foreground size-6" />
                        )}
                      </div>

                      {/* Informacion principal */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {title}
                          </p>
                          {version && (
                            <span className="bg-primary/10 text-primary border-primary/20 rounded px-1.5 py-0.2 text-[11px] font-semibold">
                              V{version}
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs font-normal">
                            · {typeLabel}
                            {area ? ` · ${area}` : ""}
                            {category ? ` · ${category}` : ""}
                          </span>
                        </div>

                        {approval.comment && (
                          <p className="text-muted-foreground flex items-center gap-1 text-xs italic line-clamp-1">
                            <MessageSquare className="size-3 shrink-0" />
                            &ldquo;{approval.comment}&rdquo;
                          </p>
                        )}

                        <p className="text-muted-foreground text-xs">
                          Solicitada por {approval.requestedBy.name} ·{" "}
                          {formatRelative(approval.requestedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Estado y conteo de movimientos */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <span className="text-muted-foreground text-xs">
                        {approval._count.events} movimiento
                        {approval._count.events === 1 ? "" : "s"}
                      </span>
                      <ApprovalStatusBadge status={approval.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DataState>
    </div>
  );
}
