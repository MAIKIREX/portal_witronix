"use client";

import { useState } from "react";
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
import { useMutation } from "@/hooks/use-mutation";
import { clientsApi } from "../api";
import type { Client } from "../types";

export function ClientFormDialog({
  client,
  onSaved,
}: {
  /** Sin cliente, el dialogo crea uno nuevo. */
  client?: Client;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = Boolean(client);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(client?.name ?? "");
  const [taxId, setTaxId] = useState(client?.taxId ?? "");
  const [contactEmail, setContactEmail] = useState(client?.contactEmail ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  const save = useMutation(
    () => {
      // Los campos vacios se envian sin definir, no como cadena vacia: el
      // backend valida el formato del email y "" no lo pasaria.
      const input = {
        name: name.trim(),
        taxId: taxId.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      return client
        ? clientsApi.update(client.id, input)
        : clientsApi.create(input);
    },
    {
      successToast: isEdit ? "Cliente actualizado" : "Cliente creado",
      onSuccess: () => {
        setOpen(false);
        void onSaved();
      },
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size={isEdit ? "icon-sm" : "sm"}
            variant={isEdit ? "ghost" : "default"}
          />
        }
        aria-label={isEdit ? "Editar cliente" : undefined}
      >
        {isEdit ? <Pencil /> : <Plus />}
        {isEdit ? null : "Nuevo cliente"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) void save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
            <DialogDescription>
              Empresa a la que pertenecen los proyectos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="client-name">Nombre</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={160}
              disabled={save.isPending}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-taxid">NIT / CIF</Label>
              <Input
                id="client-taxid"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                maxLength={40}
                disabled={save.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefono</Label>
              <Input
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                disabled={save.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">Email de contacto</Label>
            <Input
              id="client-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={save.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Direccion</Label>
            <Input
              id="client-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              disabled={save.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">Notas internas</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={2}
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
            <Button type="submit" disabled={!name.trim() || save.isPending}>
              {isEdit ? "Guardar" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
