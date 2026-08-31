"use client";

import { PageHeader } from "@/components/common/page-header";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { DashboardView } from "@/features/projects/components/dashboard-view";

export default function DashboardPage() {
  const user = useCurrentUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Resumen de tus proyectos y novedades recientes."
      />
      <DashboardView />
    </div>
  );
}
