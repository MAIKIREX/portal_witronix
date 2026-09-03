"use client";

import { ProjectStatus } from "@witronix/shared";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { useMutation } from "@/hooks/use-mutation";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { projectsApi } from "../api";
import { useProject } from "../context";

const ALL_STATUSES = Object.values(ProjectStatus);

/**
 * Puntos de estado con colores fuertes y notorios (sin tonos pastel suaves) para una apariencia formal.
 */
const STATUS_DOT_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.POR_INICIAR]: "bg-slate-500 ring-2 ring-slate-200 dark:ring-slate-700",
  [ProjectStatus.EN_DISENO]: "bg-sky-500 ring-2 ring-sky-200 dark:ring-sky-800",
  [ProjectStatus.ESPERANDO_CLIENTE]: "bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-800",
  [ProjectStatus.APROBADO]: "bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800",
  [ProjectStatus.EN_INSTALACION]: "bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-800",
  [ProjectStatus.FINALIZADO]: "bg-teal-500 ring-2 ring-teal-200 dark:ring-teal-800",
  [ProjectStatus.CANCELADO]: "bg-rose-600 ring-2 ring-rose-200 dark:ring-rose-800",
};

/**
 * Cambio de estado del proyecto en la cabecera.
 *
 * Diseño formal y limpio:
 * - Botón select completo en color celeste corporativo con flecha indicadora.
 * - Opciones con puntos indicadores de color sólido y definido.
 */
export function ProjectStatusMenu() {
  const { project, refetch } = useProject();
  const { canChangeProjectStatus } = usePermissions();

  const { mutate, isPending } = useMutation(
    (status: ProjectStatus) => projectsApi.updateStatus(project.id, status),
    {
      successToast: "Estado actualizado",
      onSuccess: () => void refetch(),
    },
  );

  if (!canChangeProjectStatus) {
    return <ProjectStatusBadge status={project.status} showIcon={false} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          "group inline-flex items-center gap-2 h-8 px-4 rounded-full text-xs font-semibold whitespace-nowrap",
          "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white",
          "border border-sky-500/40 shadow-xs shadow-sky-600/20 transition-all duration-150 select-none cursor-pointer outline-none",
          "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-60",
        )}
      >
        {isPending && (
          <Loader2 className="size-3 animate-spin text-white shrink-0" />
        )}
        <span className="leading-none tracking-wide">
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-white/85 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48 p-1 rounded-lg shadow-md border-border/80">
        <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
          Cambiar estado a
        </div>
        <DropdownMenuSeparator />
        {ALL_STATUSES.filter((status) => status !== project.status).map(
          (status) => (
            <DropdownMenuItem
              key={status}
              disabled={isPending}
              onClick={() => void mutate(status)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs font-medium text-foreground hover:bg-accent"
            >
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  STATUS_DOT_COLORS[status],
                )}
              />
              <span>{PROJECT_STATUS_LABELS[status]}</span>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
