"use client";

import { ProjectStatus } from "@witronix/shared";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  TONE_DOT_CLASSES,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { projectsApi } from "../api";
import { useProject } from "../context";

const ALL_STATUSES = Object.values(ProjectStatus);

/**
 * Cambio de estado del proyecto.
 *
 * Solo ADMIN y PROJECT_MANAGER pueden cambiarlo (@Roles en el backend). Para
 * el resto se muestra el distintivo sin mas: ocultar la accion evita ofrecer
 * un boton que devolveria 403.
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
    return <ProjectStatusBadge status={project.status} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={isPending} />}
      >
        <ProjectStatusBadge status={project.status} />
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <div className="text-muted-foreground px-1.5 py-1 text-xs">
          Cambiar estado a
        </div>
        <DropdownMenuSeparator />
        {ALL_STATUSES.filter((status) => status !== project.status).map(
          (status) => (
            <DropdownMenuItem
              key={status}
              disabled={isPending}
              onClick={() => void mutate(status)}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  TONE_DOT_CLASSES[PROJECT_STATUS_TONES[status]],
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
