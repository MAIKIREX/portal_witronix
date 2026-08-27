"use client";

import { Archive, ArchiveRestore, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@/hooks/use-mutation";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { projectsApi } from "../api";
import { useProject } from "../context";

/** Archivar y desarchivar. Solo ADMIN y PROJECT_MANAGER. */
export function ProjectActionsMenu() {
  const { project, refetch } = useProject();
  const { canArchiveProject } = usePermissions();

  const archive = useMutation(() => projectsApi.archive(project.id), {
    successToast: "Proyecto archivado",
    onSuccess: () => void refetch(),
  });
  const unarchive = useMutation(() => projectsApi.unarchive(project.id), {
    successToast: "Proyecto desarchivado",
    onSuccess: () => void refetch(),
  });

  if (!canArchiveProject) return null;

  const archived = Boolean(project.archivedAt);
  const busy = archive.isPending || unarchive.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        aria-label="Acciones del proyecto"
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {archived ? (
          <DropdownMenuItem
            disabled={busy}
            onClick={() => void unarchive.mutate()}
          >
            <ArchiveRestore />
            Desarchivar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={busy}
            onClick={() => void archive.mutate()}
          >
            <Archive />
            Archivar proyecto
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
