"use client";

import { FolderOpen, SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DataState, EmptyState } from "@/components/common/states";
import { PaginationBar } from "@/components/common/pagination-bar";
import { useProjects } from "../hooks/use-projects";
import { ProjectFiltersBar } from "./project-filters-bar";
import { ProjectsTable } from "./projects-table";
import { ProjectFormDialog } from "./project-form-dialog";
import { usePermissions } from "@/features/auth/hooks/use-permissions";

export function ProjectsList() {
  const {
    data,
    error,
    isLoading,
    isValidating,
    refetch,
    values,
    setParams,
    reset,
    hasFilters,
  } = useProjects();

  const { canCreateProject } = usePermissions();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <ProjectFiltersBar
            values={values}
            setParams={setParams}
            reset={reset}
            hasFilters={hasFilters}
          />
        </div>
        {canCreateProject && <ProjectFormDialog onSaved={refetch} />}
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={<TableSkeleton />}
        isEmpty={(d) => d.data.length === 0}
        empty={
          // Distinguir "no hay nada" de "el filtro no encuentra nada": con
          // filtros aplicados, lo util es ofrecer quitarlos.
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="Ningun proyecto coincide con el filtro"
              description="Prueba con otros terminos o quita los filtros."
              action={
                <Button variant="outline" size="sm" onClick={reset}>
                  Quitar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="Todavia no hay proyectos"
              description="Cuando se te asigne un proyecto aparecera aqui."
            />
          )
        }
      >
        {(page) => (
          <div
            className={
              // Se atenua durante la recarga en lugar de saltar al esqueleto:
              // con keepPreviousData la tabla anterior sigue en pantalla.
              isValidating ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"
            }
          >
            <ProjectsTable projects={page.data} />
            <PaginationBar
              meta={page.meta}
              isLoading={isValidating}
              onPageChange={(nextPage) => setParams({ page: nextPage })}
            />
          </div>
        )}
      </DataState>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
