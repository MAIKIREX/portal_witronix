"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@witronix/shared";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { useMutation } from "@/hooks/use-mutation";
import { clientsApi } from "@/features/clients/api";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { projectsApi } from "../api";
import type { ProjectDetail } from "../types";

const STATUS_ITEMS = Object.values(ProjectStatus).map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status],
}));

/**
 * Alta y edicion de proyecto en el mismo dialogo.
 *
 * En edicion NO se ofrece cambiar el cliente: el backend excluye `clientId`
 * del DTO de actualizacion a proposito, porque mover un proyecto de cliente
 * dejaria inconsistentes los accesos ya concedidos.
 */
export function ProjectFormDialog({
  project,
  onSaved,
}: {
  /** Sin proyecto, el dialogo crea uno nuevo. */
  project?: ProjectDetail;
  onSaved?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(project?.name ?? "");
  const [clientId, setClientId] = useState(project?.clientId ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [location, setLocation] = useState(project?.location ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? ProjectStatus.POR_INICIAR,
  );
  const [startDate, setStartDate] = useState(
    project?.startDate?.slice(0, 10) ?? "",
  );
  const [targetDate, setTargetDate] = useState(
    project?.targetDate?.slice(0, 10) ?? "",
  );

  // La lista de clientes solo se pide al abrir el dialogo.
  const clients = useApi(
    (signal) => clientsApi.list({ limit: 100 }, signal),
    [],
    { enabled: open && !isEdit },
  );

  const save = useMutation(
    () => {
      if (project) {
        // Solo se envian los campos editables: forbidNonWhitelisted rechaza
        // cualquier extra con un 400.
        return projectsApi.update(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          status,
          startDate: startDate || undefined,
          targetDate: targetDate || undefined,
        });
      }
      return projectsApi.create({
        clientId,
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        status,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
      });
    },
    {
      successToast: isEdit ? "Proyecto actualizado" : "Proyecto creado",
      onSuccess: (saved) => {
        setOpen(false);
        void onSaved?.();
        if (!isEdit) router.push(`/proyectos/${saved.id}`);
      },
    },
  );

  const canSubmit = name.trim() !== "" && (isEdit || clientId !== "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant={isEdit ? "outline" : "default"} />}
      >
        {isEdit ? <Pencil /> : <Plus />}
        {isEdit ? "Editar" : "Nuevo proyecto"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar proyecto" : "Nuevo proyecto"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "El cliente no se puede cambiar una vez creado el proyecto."
                : "El codigo del proyecto se genera automaticamente."}
            </DialogDescription>
          </DialogHeader>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                items={(clients.data?.data ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={clientId}
                onValueChange={(value) => setClientId(String(value ?? ""))}
                disabled={save.isPending || clients.isLoading}
              >
                <SelectTrigger aria-label="Cliente del proyecto">
                  <SelectValue
                    placeholder={
                      clients.isLoading ? "Cargando…" : "Elige un cliente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(clients.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="project-name">Nombre</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={160}
              disabled={save.isPending}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-location">Ubicacion</Label>
              <Input
                id="project-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                disabled={save.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                items={STATUS_ITEMS}
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatus)}
                disabled={save.isPending}
              >
                <SelectTrigger aria-label="Estado del proyecto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-start">Fecha de inicio</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={save.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-target">Fecha objetivo</Label>
              <Input
                id="project-target"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={save.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Descripcion</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              disabled={save.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || save.isPending}>
              {isEdit ? "Guardar" : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
