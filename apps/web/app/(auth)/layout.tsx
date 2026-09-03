import { GuestGuard } from "@/features/auth/components/guest-guard";
import { ThemeToggle } from "@/components/common/theme-toggle";

/**
 * Layout de las pantallas de autenticacion: tarjeta centrada, sin shell.
 * El grupo (auth) no aparece en la URL: /login, /recuperar, /invitacion/...
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <GuestGuard>
      <div className="fixed top-4 right-4 z-30">
        <ThemeToggle />
      </div>
      <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-auto items-center justify-center">
              {/* Modo claro: logo corporativo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-corporativo-de-la-empresa.webp"
                alt="Witronix LED Logo"
                className="h-11 w-auto object-contain dark:hidden"
              />
              {/* Modo oscuro: versión blanca sin caja */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-de-witronix-color-blanco.webp"
                alt="Witronix LED Logo"
                className="hidden h-11 w-auto object-contain dark:block drop-shadow-[0_0_16px_rgba(73,191,229,0.35)]"
              />
            </div>
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Portal de Proyectos
            </p>
          </div>
          {children}
        </div>
      </div>
    </GuestGuard>
  );
}
