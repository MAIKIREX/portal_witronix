import { GuestGuard } from "@/features/auth/components/guest-guard";

/**
 * Layout de las pantallas de autenticacion: tarjeta centrada, sin shell.
 * El grupo (auth) no aparece en la URL: /login, /recuperar, /invitacion/...
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <GuestGuard>
      <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center">
            <p className="font-heading text-primary text-lg font-semibold tracking-tight">
              Witronix
            </p>
            <p className="text-muted-foreground text-sm">
              Portal de proyectos
            </p>
          </div>
          {children}
        </div>
      </div>
    </GuestGuard>
  );
}
