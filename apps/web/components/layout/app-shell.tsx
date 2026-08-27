"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { AppSidebar } from "./app-sidebar";
import { BreadcrumbProvider, Breadcrumbs } from "./breadcrumbs";

/**
 * Estructura de la aplicacion autenticada: barra lateral colapsable + cabecera
 * pegada arriba + contenido.
 *
 * Solo se monta dentro de <AuthGuard>, asi que aqui ya hay sesion garantizada
 * (la barra lateral y el menu de usuario usan useCurrentUser()).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs />
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
