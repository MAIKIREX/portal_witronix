"use client";

import { Toaster } from "sileo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap";
import { ThemeProvider, useTheme } from "@/context/theme-provider";

/**
 * Proveedores globales de la app.
 *
 * Todo el portal es client-side: el token Bearer vive en el navegador, asi que
 * el servidor de Next nunca puede hacer fetch de datos de la API. Next actua
 * solo como router y bundler. NO metas fetch de datos en Server Components:
 * no tendrian sesion.
 *
 */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster position="top-right" theme={resolvedTheme} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthBootstrap />
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

