"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Laptop, LogOut, MonitorSmartphone, Moon, Sun, User } from "lucide-react";
import { sileo } from "sileo";
import { useTheme } from "@/context/theme-provider";
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
  const { theme, setTheme } = useTheme();

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
      // Si falla en el servidor se cierra igualmente en local
    }
    await logout();
    sileo.info({ title: "Se han cerrado todas tus sesiones" });
    router.replace("/login");
  }

  return (
    <SidebarMenu className="border-0 border-y-0 shadow-none ring-0 outline-none">
      <SidebarMenuItem className="border-0 border-y-0 shadow-none ring-0 outline-none">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-white/20 hover:bg-white/15 text-white rounded-2xl p-2 transition-colors border-0 shadow-none ring-0 outline-none focus-visible:ring-0 focus-visible:outline-none"
              />
            }
          >
            <Avatar className="size-8 rounded-full border-0 shadow-none ring-0 outline-none bg-white/20 text-white shrink-0">
              <AvatarFallback className="rounded-full text-xs font-bold text-white bg-white/20 shadow-none ring-0 outline-none">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-white">{user.name}</span>
              <span className="text-white/70 truncate text-xs">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-white/70 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
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
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Tema de visualización
            </div>
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sun className="size-4 text-amber-500" />
                <span>Modo Claro</span>
              </div>
              {theme === "light" && (
                <Check className="size-3.5 text-primary stroke-[2.5]" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Moon className="size-4 text-[#00ffbf]" />
                <span>Modo Oscuro</span>
              </div>
              {theme === "dark" && (
                <Check className="size-3.5 text-primary stroke-[2.5]" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Laptop className="size-4 text-sky-500" />
                <span>Sistema</span>
              </div>
              {theme === "system" && (
                <Check className="size-3.5 text-primary stroke-[2.5]" />
              )}
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

export function NavbarUserMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    setBusy(true);
    await logout();
    router.replace("/login");
  }

  async function handleLogoutAll() {
    setBusy(true);
    try {
      await authApi.logoutAll();
    } catch {
      // Si falla en el servidor se cierra igualmente en local
    }
    await logout();
    sileo.info({ title: "Se han cerrado todas tus sesiones" });
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="group flex items-center gap-2.5 rounded-full border border-border bg-white/80 dark:bg-[#0d1926]/75 px-2.5 py-1.5 backdrop-blur-xs transition-all duration-200 hover:border-primary/50 hover:bg-white dark:hover:bg-[#0d1926] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 select-none cursor-pointer shadow-2xs"
          />
        }
      >
        <Avatar className="size-8 rounded-full border border-primary/25 bg-primary/10">
          <AvatarFallback className="rounded-full text-xs font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:grid text-left text-xs leading-tight pr-1">
          <span className="font-semibold text-foreground truncate max-w-[130px]">
            {user.name}
          </span>
          <span className="text-muted-foreground text-[10px] truncate max-w-[130px]">
            {user.email}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-56" align="end" sideOffset={6}>
        <div className="grid px-2 py-1.5 text-xs">
          <span className="truncate font-semibold text-foreground">{user.name}</span>
          <span className="text-muted-foreground truncate text-[11px]">
            {user.email}
          </span>
          <span className="text-primary truncate text-[10px] font-medium mt-0.5">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/perfil" />}>
          <User />
          Mi cuenta
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Tema de visualización
        </div>
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-amber-500" />
            <span>Modo Claro</span>
          </div>
          {theme === "light" && (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Moon className="size-4 text-[#00ffbf]" />
            <span>Modo Oscuro</span>
          </div>
          {theme === "dark" && (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Laptop className="size-4 text-sky-500" />
            <span>Sistema</span>
          </div>
          {theme === "system" && (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={busy} onClick={handleLogoutAll}>
          <MonitorSmartphone />
          Cerrar sesión en todos los dispositivos
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onClick={handleLogout}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
