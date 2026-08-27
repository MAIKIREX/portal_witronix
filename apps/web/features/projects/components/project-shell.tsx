"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/common/states";
import { useSetBreadcrumbs } from "@/components/layout/breadcrumbs";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { projectsApi } from "../api";
import { ProjectProvider, useProject } from "../context";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import type { ProjectDetail } from "../types";
import { ProjectStatusMenu } from "./project-status-menu";
import { ProjectFormDialog } from "./project-form-dialog";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectProgressControl } from "./project-progress-control";

const TABS = [
  { segment: "", label: "Resumen" },
  { segment: "renders", label: "Renders" },
  { segment: "archivos", label: "Documentos" },
  { segment: "comentarios", label: "Comentarios" },
  { segment: "aprobaciones", label: "Aprobaciones" },
  { segment: "actividad", label: "Actividad" },
] as const;

/**
 * Carga el proyecto UNA vez para todo el segmento y lo comparte por contexto.
 * Sin esto, cada pestana volveria a pedirlo al montarse.
 */
export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { data, error, isLoading, refetch, setData } = useApi<ProjectDetail>(
    (signal) => projectsApi.detail(projectId, signal),
    [projectId],
  );

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      skeleton={<ProjectSkeleton />}
    >
      {(project) => (
        <ProjectProvider
          value={{
            project,
            refetch,
            setProject: setData,
            error,
          }}
        >
          <ProjectHeader project={project} />
          <div className="mt-6">{children}</div>
        </ProjectProvider>
      )}
    </DataState>
  );
}

function ProjectHeader({ project }: { project: ProjectDetail }) {
  const { refetch } = useProject();
  const { canEditProject } = usePermissions();
  const pathname = usePathname();
  const setBreadcrumbs = useSetBreadcrumbs();
  const base = `/proyectos/${project.id}`;

  // Las migas no pueden deducir el nombre del proyecto desde la ruta, asi que
  // lo pone aqui la pantalla que ya lo tiene cargado.
  useEffect(() => {
    setBreadcrumbs([
      { label: "Proyectos", href: "/proyectos" },
      { label: project.name },
    ]);
    return () => setBreadcrumbs(null);
  }, [project.name, setBreadcrumbs]);

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.archivedAt && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Archive className="size-3.5" />
                archivado
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            <span className="font-mono">{project.code}</span>
            {" · "}
            {project.client.name}
            {project.location ? ` · ${project.location}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ProjectProgressControl />
          <ProjectStatusMenu />
          {canEditProject && (
            <ProjectFormDialog project={project} onSaved={refetch} />
          )}
          <ProjectActionsMenu />
        </div>
      </div>

      <nav className="flex gap-1 border-b" aria-label="Secciones del proyecto">
        {TABS.map((tab) => {
          const href = tab.segment ? `${base}/${tab.segment}` : base;
          const active = tab.segment
            ? pathname.startsWith(href)
            : pathname === base;
          return (
            <Link
              key={tab.segment || "resumen"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-primary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function ProjectSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
