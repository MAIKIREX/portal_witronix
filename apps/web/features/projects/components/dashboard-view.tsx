"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ProjectStatus } from "@witronix/shared";
import {
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  FolderOpen,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { formatCount, formatRelative } from "@/lib/format";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
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
          title="Todavía no hay proyectos"
          description="Cuando se te asigne un proyecto aparecerá aquí."
        />
      }
    >
      {(summary) => <DashboardContent summary={summary} />}
    </DataState>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const { totales, porEstado, novedades } = summary;
  const containerRef = useRef<HTMLDivElement>(null);

  // Solo se muestran los estados con proyectos
  const activeStatuses = STATUS_ORDER.filter((s) => porEstado[s] > 0);

  const hasNews =
    novedades.archivosNuevos > 0 ||
    novedades.aprobacionesPendientes > 0 ||
    novedades.comentariosNuevos > 0;

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from(".bento-item", {
        y: 18,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "all",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [summary]);

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Sección Superior: Métricas Principales (2 Tarjetas originales en estilo Bento) */}
      <section className="grid gap-5 sm:grid-cols-2">
        {/* Tarjeta 1: Total Proyectos (Hero Featured Card con gradiente profundo Witronix Blue) */}
        <div className="bento-item group relative overflow-hidden rounded-[26px] p-6 sm:p-7 bg-gradient-to-br from-[#09111b] via-[#19314d] to-[#264a73] border border-[#336399]/40 shadow-xl shadow-blue-950/15 flex flex-col justify-between min-h-[185px] transition-all duration-300 hover:border-[#407bbf]/60 hover:shadow-blue-900/20">
          {/* Luz ambiental sutil */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-[#407bbf]/20 blur-3xl" />

          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-sm font-semibold tracking-wide text-white/90">
              Proyectos
            </span>
            <Link
              href="/proyectos"
              className="size-8 rounded-full border border-white/25 bg-white/10 flex items-center justify-center text-white/90 group-hover:bg-white/20 group-hover:text-white group-hover:scale-105 transition-all duration-200"
              title="Ver proyectos"
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="py-2 z-10">
            <span className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
              {totales.proyectos}
            </span>
          </div>

          <div className="z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#407bbf]/25 text-[#e5fff9] border border-[#6696cc]/35 shadow-xs">
              <TrendingUp className="size-3.5" />
              <span>{formatCount(totales.activos, "activo")}</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Pendientes de tu revisión */}
        <div className="bento-item group relative overflow-hidden rounded-[26px] p-6 sm:p-7 bg-white border border-[#d9e5f2] shadow-xs flex flex-col justify-between min-h-[185px] transition-all duration-300 hover:border-[#336399]/50 hover:shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-muted-foreground tracking-wide">
              Pendientes de tu revisión
            </span>
            <Link
              href="/proyectos"
              className="size-8 rounded-full border border-border/70 bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground group-hover:bg-muted group-hover:scale-105 transition-all duration-200"
              title="Ver pendientes"
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="py-2">
            <span
              className={cn(
                "font-heading text-4xl sm:text-5xl font-bold tracking-tight tabular-nums",
                novedades.aprobacionesPendientes > 0
                  ? "text-amber-500"
                  : "text-foreground",
              )}
            >
              {novedades.aprobacionesPendientes}
            </span>
          </div>

          <div>
            {novedades.aprobacionesPendientes > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 shadow-xs">
                <Clock className="size-3.5" />
                <span>Requieren una decisión</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted/70 text-muted-foreground border border-border/60">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Nada pendiente</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sección "Por estado" */}
      {activeStatuses.length > 0 && (
        <section className="bento-item space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Por estado
            </h2>
            <span className="text-xs text-muted-foreground">
              Filtro rápido por fase
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeStatuses.map((status) => (
              <Link
                key={status}
                href={`/proyectos?status=${status}`}
                className="inline-flex transition-transform duration-150 hover:scale-105 active:scale-95"
                title={`Ver proyectos ${PROJECT_STATUS_LABELS[status] || ""}`}
              >
                <ProjectStatusBadge
                  status={status}
                  count={porEstado[status]}
                  className="px-3 py-1.5 text-xs shadow-xs hover:shadow-md cursor-pointer"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sección "Novedades" */}
      <section className="bento-item space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Novedades
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted/60 border border-border/50">
            <Clock className="size-3.5 opacity-70" />
            <span>desde {formatRelative(novedades.desde)}</span>
          </span>
        </div>

        {hasNews ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Archivos Nuevos */}
            <div className="bento-item group relative overflow-hidden rounded-[24px] p-5 sm:p-6 bg-white border border-[#d9e5f2] shadow-xs flex flex-col justify-between min-h-[160px] transition-all duration-300 hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Archivos nuevos
                </span>
                <div className="size-7 rounded-full border border-border/60 bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-all">
                  <FileText className="size-3.5" />
                </div>
              </div>

              <div className="py-2">
                <span className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {novedades.archivosNuevos}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/70 text-muted-foreground border border-border/50 w-fit">
                <span>En tus proyectos</span>
              </div>
            </div>

            {/* Comentarios Nuevos */}
            <div className="bento-item group relative overflow-hidden rounded-[24px] p-5 sm:p-6 bg-white border border-[#d9e5f2] shadow-xs flex flex-col justify-between min-h-[160px] transition-all duration-300 hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Comentarios nuevos
                </span>
                <div className="size-7 rounded-full border border-border/60 bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-all">
                  <MessageSquare className="size-3.5" />
                </div>
              </div>

              <div className="py-2">
                <span className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {novedades.comentariosNuevos}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/70 text-muted-foreground border border-border/50 w-fit">
                <span>Mensajes sin leer</span>
              </div>
            </div>

            {/* Aprobaciones Pendientes */}
            <div className="bento-item group relative overflow-hidden rounded-[24px] p-5 sm:p-6 bg-white border border-[#d9e5f2] shadow-xs flex flex-col justify-between min-h-[160px] transition-all duration-300 hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Aprobaciones pendientes
                </span>
                <div className="size-7 rounded-full border border-border/60 bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-all">
                  <CheckSquare className="size-3.5" />
                </div>
              </div>

              <div className="py-2">
                <span className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {novedades.aprobacionesPendientes}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/70 text-muted-foreground border border-border/50 w-fit">
                <span>Requieren visto bueno</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border/80 bg-white/60 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Sin novedades en los últimos días.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-[185px] rounded-[26px]" />
        <Skeleton className="h-[185px] rounded-[26px]" />
      </div>
      <div className="space-y-3.5">
        <Skeleton className="h-5 w-28 rounded-full" />
        <div className="flex flex-wrap gap-2.5">
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>
      <div className="space-y-3.5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-[160px] rounded-[24px]" />
          <Skeleton className="h-[160px] rounded-[24px]" />
          <Skeleton className="h-[160px] rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
