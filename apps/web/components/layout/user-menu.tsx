"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, MonitorSmartphone, User } from "lucide-react";
import { sileo } from "sileo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { authApi } from "@/features/auth/api";
import { logout } from "@/features/auth/session-manager";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";

export function UserMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await logout();
    router.replace("/login");
  }

  /** Cierra la sesion en todos los dispositivos (util si se pierde un portatil). */
  async function handleLogoutAll() {
    setBusy(true);
    try {
      await authApi.logoutAll();
    } catch {
      // Si falla en el servidor se cierra igualmente en local: no dejar al
      // usuario atrapado dentro por un error de red.
    }
    await logout();
    sileo.info({ title: "Se han cerrado todas tus sesiones" });
    router.replace("/login");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>

          {/* El ancho lo fija ya el propio componente con --anchor-width
              (Base UI). No uses las variables --radix-*: aqui no existen. */}
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Cabecera informativa, no un DropdownMenuLabel: en Base UI ese
                componente es un GroupLabel y falla si no esta dentro de un
                <DropdownMenuGroup>. Ademas aqui no etiqueta a un grupo de
                opciones, solo identifica al usuario. */}
            <div className="grid px-1.5 py-1 text-sm">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/perfil" />}>
              <User />
              Mi cuenta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={busy} onClick={handleLogoutAll}>
              <MonitorSmartphone />
              Cerrar sesion en todos los dispositivos
            </DropdownMenuItem>
            <DropdownMenuItem disabled={busy} onClick={handleLogout}>
              <LogOut />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
