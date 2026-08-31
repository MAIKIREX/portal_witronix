"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { BreadcrumbProvider } from "./breadcrumbs";

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
        <SidebarInset className="bg-transparent">
          {/* Disparador flotante discreto exclusivo para movil cuando el sidebar esta colapsado */}
          <div className="md:hidden fixed top-3 left-3 z-30 pointer-events-none">
            <SidebarTrigger className="pointer-events-auto text-[#19314d] size-9 rounded-full border border-border bg-white/90 shadow-md backdrop-blur-xs" />
          </div>

          <main className="flex-1 px-4 sm:px-8 py-6">
            <div className="w-full">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
