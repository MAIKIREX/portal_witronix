"use client";

import { useState } from "react";
import { Role } from "@witronix/shared";
import { UserPlus } from "lucide-react";
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
import { ROLE_LABELS } from "@/lib/labels";
import { authApi } from "../api";

const ROLE_ITEMS = Object.values(Role).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

/**
 * Invita a alguien al portal. El backend crea el usuario sin contrasena y
 * envia un correo con el enlace a /invitacion/{token}, que caduca en 72 h.
 *
 * Solo ADMIN y PROJECT_MANAGER.
 */
export function InviteUserDialog({
  onInvited,
}: {
  onInvited?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [clientId, setClientId] = useState("");

  // Un usuario con rol CLIENT tiene que pertenecer a una empresa: el backend
  // rechaza la invitacion sin clientId en ese caso.
  const needsClient = role === Role.CLIENT;

  const clients = useApi(
    (signal) => clientsApi.list({ isActive: true, limit: 100 }, signal),
    [],
    { enabled: open && needsClient },
  );

  const invite = useMutation(
    () =>
      authApi.createInvitation({
        email: email.trim(),
        name: name.trim(),
        role,
        clientId: needsClient ? clientId : undefined,
      }),
    {
      successToast: "Invitacion enviada",
      onSuccess: () => {
        setOpen(false);
        setEmail("");
        setName("");
        setClientId("");
        setRole(Role.CLIENT);
        void onInvited?.();
      },
    },
  );

  const canSubmit =
    email.trim() !== "" && name.trim() !== "" && (!needsClient || clientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus />
        Invitar usuario
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void invite.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Invitar al portal</DialogTitle>
            <DialogDescription>
              Recibira un correo con un enlace para crear su contrasena. Caduca
              en 72 horas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Nombre</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              disabled={invite.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={invite.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select
              items={ROLE_ITEMS}
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              disabled={invite.isPending}
            >
              <SelectTrigger aria-label="Rol del usuario">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                items={(clients.data?.data ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={clientId}
                onValueChange={(value) => setClientId(String(value ?? ""))}
                disabled={invite.isPending || clients.isLoading}
              >
                <SelectTrigger aria-label="Empresa del cliente">
                  <SelectValue
                    placeholder={
                      clients.isLoading ? "Cargando…" : "Elige una empresa"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || invite.isPending}>
              Enviar invitacion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
