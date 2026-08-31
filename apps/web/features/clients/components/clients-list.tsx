"use client";

import { useState } from "react";
import { Building2, Power } from "lucide-react";
import { Role } from "@witronix/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataState, EmptyState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import { useMutation } from "@/hooks/use-mutation";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { TONE_CLASSES, TONE_DOT_CLASSES } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/api";
import { clientsApi } from "../api";
import type { Client } from "../types";
import { ClientFormDialog } from "./client-form-dialog";

export function ClientsList() {
  const [onlyActive, setOnlyActive] = useState(false);
  const user = useCurrentUser();

  const { data, error, isLoading, refetch } = useApi<Paginated<Client>>(
    (signal) =>
      // `isActive` en false debe omitirse: el backend lo leeria como true.
      clientsApi.list({ isActive: onlyActive || undefined, limit: 100 }, signal),
    [onlyActive],
    { keepPreviousData: true },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant={onlyActive ? "secondary" : "outline"}
          size="sm"
          onClick={() => setOnlyActive((v) => !v)}
          aria-pressed={onlyActive}
        >
          Solo activos
        </Button>
        <ClientFormDialog onSaved={refetch} />
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={
          <div className="space-y-2 rounded-lg border p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        }
        isEmpty={(d) => d.data.length === 0}
        empty={
          <EmptyState
            icon={Building2}
            title="Todavia no hay clientes"
            description="Crea el primero para poder asignarle proyectos."
          />
        }
      >
        {(page) => (
          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-14 font-mono text-[11px] text-muted-foreground/80">
                    (#)
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Contacto
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.data.map((client, index) => (
                  <ClientRow
                    key={client.id}
                    index={index}
                    client={client}
                    canDeactivate={user.role === Role.ADMIN}
                    onChanged={refetch}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataState>
    </div>
  );
}

function ClientRow({
  client,
  index,
  canDeactivate,
  onChanged,
}: {
  client: Client;
  index: number;
  canDeactivate: boolean;
  onChanged: () => void | Promise<void>;
}) {
  // "Borrar" en el backend es en realidad desactivar: se conserva el
  // historico de proyectos del cliente.
  const deactivate = useMutation(() => clientsApi.deactivate(client.id), {
    successToast: "Cliente desactivado",
    onSuccess: () => void onChanged(),
  });
  const reactivate = useMutation(
    () => clientsApi.update(client.id, { isActive: true }),
    { successToast: "Cliente reactivado", onSuccess: () => void onChanged() },
  );

  return (
    <TableRow className="group border-b border-border/70 hover:bg-[#ecf2f9]/50 transition-colors">
      <TableCell className="w-14 font-mono text-xs text-muted-foreground/50 tabular-nums">
        ({String(index + 1).padStart(2, "0")})
      </TableCell>
      <TableCell>
        <p className="font-medium text-base text-foreground">{client.name}</p>
        {client.taxId && (
          <p className="text-muted-foreground font-mono text-xs">
            {client.taxId}
          </p>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
        {client.contactEmail ?? "—"}
        {client.phone && (
          <span className="block text-xs">{client.phone}</span>
        )}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap tracking-wide shadow-2xs backdrop-blur-xs",
            client.isActive ? TONE_CLASSES.success : TONE_CLASSES.neutral,
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0",
              client.isActive
                ? TONE_DOT_CLASSES.success
                : TONE_DOT_CLASSES.neutral,
            )}
            aria-hidden="true"
          />
          <span className="leading-tight">
            {client.isActive ? "Activo" : "Inactivo"}
          </span>
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <ClientFormDialog client={client} onSaved={onChanged} />
          {canDeactivate && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={deactivate.isPending || reactivate.isPending}
              onClick={() =>
                void (client.isActive
                  ? deactivate.mutate()
                  : reactivate.mutate())
              }
              aria-label={
                client.isActive ? "Desactivar cliente" : "Reactivar cliente"
              }
            >
              <Power />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
