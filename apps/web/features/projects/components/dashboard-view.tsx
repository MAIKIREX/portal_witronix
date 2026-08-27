"use client";

import Link from "next/link";
import { ProjectStatus } from "@witronix/shared";
import { FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { formatCount, formatRelative } from "@/lib/format";
import { useDashboard } from "../hooks/use-dashboard";
import type { DashboardSummary } from "../types";

/** Orden de presentacion: sigue el ciclo de vida real de un proyecto. */
const STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.POR_INICIAR,
  ProjectStatus.EN_DISENO,
  ProjectStatus.ESPERANDO_CLIENTE,
  ProjectStatus.APROBADO,
  ProjectStatus.EN_INSTALACION,
  ProjectStatus.FINALIZADO,
  ProjectStatus.CANCELADO,
];

export function DashboardView() {
  const { data, error, isLoading, refetch } = useDashboard();

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      skeleton={<DashboardSkeleton />}
      isEmpty={(d) => d.totales.proyectos === 0}
      empty={
        <EmptyState
          icon={FolderOpen}
          title="Todavia no hay proyectos"
          description="Cuando se te asigne un proyecto aparecera aqui."
        />
      }
    >
      {(summary) => <DashboardContent summary={summary} />}
    </DataState>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const { totales, porEstado, novedades } = summary;

  // Solo se muestran los estados con proyectos: una rejilla llena de ceros
  // ocupa sitio y no dice nada.
  const activeStatuses = STATUS_ORDER.filter((s) => porEstado[s] > 0);

  const hasNews =
    novedades.archivosNuevos > 0 ||
    novedades.aprobacionesPendientes > 0 ||
    novedades.comentariosNuevos > 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Proyectos"
          value={totales.proyectos}
          hint={formatCount(totales.activos, "activo")}
        />
        <StatCard
          label="Pendientes de tu revision"
          value={novedades.aprobacionesPendientes}
          hint={
            novedades.aprobacionesPendientes > 0
              ? "Requieren una decision"
              : "Nada pendiente"
          }
          emphasis={novedades.aprobacionesPendientes > 0}
        />
      </section>

      {activeStatuses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Por estado</h2>
          <div className="flex flex-wrap gap-2">
            {activeStatuses.map((status) => (
              <Link
                key={status}
                href={`/proyectos?status=${status}`}
                className="hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
              >
                <ProjectStatusBadge status={status} />
                <span className="text-sm font-medium tabular-nums">
                  {porEstado[status]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Novedades</h2>
          <p className="text-muted-foreground text-xs">
            desde {formatRelative(novedades.desde)}
          </p>
        </div>

        {hasNews ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Archivos nuevos"
              value={novedades.archivosNuevos}
            />
            <StatCard
              label="Comentarios nuevos"
              value={novedades.comentariosNuevos}
            />
            <StatCard
              label="Aprobaciones pendientes"
              value={novedades.aprobacionesPendientes}
            />
          </div>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
            Sin novedades en los ultimos dias.
          </p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: number;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p
          className={
            emphasis
              ? "text-primary text-3xl font-semibold tabular-nums"
              : "text-3xl font-semibold tabular-nums"
          }
        >
          {value}
        </p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-36 rounded-lg" />
          <Skeleton className="h-11 w-36 rounded-lg" />
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
