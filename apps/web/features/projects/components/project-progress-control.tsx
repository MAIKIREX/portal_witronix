"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@/hooks/use-mutation";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { ProgressBar } from "./projects-table";
import { projectsApi } from "../api";
import { useProject } from "../context";

/**
 * Avance del proyecto. Editable por el equipo interno
 * (@Roles(ADMIN, PROJECT_MANAGER, TECHNICIAN)); los clientes solo lo ven.
 */
export function ProjectProgressControl() {
  const { project, refetch } = useProject();
  const { canUpdateProgress } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(project.progress));

  const { mutate, isPending } = useMutation(
    (progress: number) => projectsApi.updateProgress(project.id, progress),
    {
      successToast: "Avance actualizado",
      onSuccess: () => {
        setEditing(false);
        void refetch();
      },
    },
  );

  function save() {
    const parsed = Number(value);
    // El backend valida 0-100; se comprueba antes para no gastar una peticion
    // que devolveria 400.
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setValue(String(project.progress));
      setEditing(false);
      return;
    }
    if (parsed === project.progress) {
      setEditing(false);
      return;
    }
    void mutate(parsed);
  }

  if (!canUpdateProgress) return <ProgressBar value={project.progress} />;

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <ProgressBar value={project.progress} />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setValue(String(project.progress));
            setEditing(true);
          }}
          aria-label="Editar avance"
        >
          <Pencil />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        autoFocus
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 w-20"
        aria-label="Avance en porcentaje"
      />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={save}
        disabled={isPending}
        aria-label="Guardar avance"
      >
        <Check />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setEditing(false)}
        disabled={isPending}
        aria-label="Cancelar"
      >
        <X />
      </Button>
    </div>
  );
}
