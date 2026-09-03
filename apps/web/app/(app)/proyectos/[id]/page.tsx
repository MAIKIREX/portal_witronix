"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProject } from "@/features/projects/context";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { formatDate, formatCount } from "@/lib/format";
import { PROJECT_ROLE_LABELS, ROLE_LABELS } from "@/lib/labels";

export default function ProjectOverviewPage() {
  const { project } = useProject();
  const { isStaff } = usePermissions();

  return (
    <div className="grid gap-2 lg:grid-cols-3">
      <div className="space-y-2 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-medium">Descripcion</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {project.description || "Este proyecto no tiene descripcion."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-medium">Contenido</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <Stat label="Renders" value={project._count.renders} />
              <Stat label="Documentos" value={project._count.files} />
              <Stat label="Comentarios" value={project._count.comments} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-sm font-medium">Datos</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Cliente" value={project.client.name} />
              <Row label="Inicio" value={formatDate(project.startDate)} />
              <Row
                label="Fecha objetivo"
                value={formatDate(project.targetDate)}
              />
              {project.endDate && (
                <Row label="Fin" value={formatDate(project.endDate)} />
              )}
              {/* El nombre de quien creo el proyecto solo interesa al equipo. */}
              {isStaff && (
                <Row label="Creado por" value={project.createdBy.name} />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-sm font-medium">
              Equipo · {formatCount(project.members.length, "persona", "personas")}
            </h2>
            <ul className="space-y-2">
              {project.members.map((member) => (
                <li key={member.id} className="text-sm">
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {PROJECT_ROLE_LABELS[member.projectRole]}
                    {isStaff ? ` · ${ROLE_LABELS[member.user.role]}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
