import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/features/auth/components/auth-guard";

/**
 * Layout de la aplicacion autenticada. El grupo (app) no aparece en la URL.
 *
 * El orden importa: <AuthGuard> va por fuera porque <AppShell> usa
 * useCurrentUser(), que lanza si no hay sesion. El guard garantiza que el shell
 * no llega a renderizarse hasta que hay usuario.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
