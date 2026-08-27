"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsList } from "@/features/projects/components/projects-list";

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Proyectos"
        description="Listado de proyectos a los que tienes acceso."
      />
      {/* ProjectsList lee los filtros de la URL con useSearchParams, que exige
          un limite de <Suspense> o `next build` falla al prerenderizar. */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}
