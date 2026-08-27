"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useSession } from "../hooks/use-session";

/**
 * Espejo de <AuthGuard> para las pantallas de autenticacion.
 *
 * Sin esto, un usuario que ya tiene sesion y abre /login ve el formulario un
 * instante antes de que se le redirija.
 */
function GuestGuardInner({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== "authenticated") return;

    const redirect = searchParams.get("redirect");
    // Solo rutas internas: un `redirect` con URL absoluta permitiria enviar al
    // usuario a un dominio externo desde un enlace manipulado (open redirect).
    const target =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/dashboard";

    router.replace(target);
  }, [status, searchParams, router]);

  if (status === "hydrating") {
    return <LoadingScreen label="Comprobando tu sesion…" />;
  }

  if (status === "authenticated") {
    return <LoadingScreen label="Entrando…" />;
  }

  return <>{children}</>;
}

/**
 * `useSearchParams` obliga a un limite de <Suspense>: sin el, `next build`
 * falla al prerenderizar (el error solo aparece en build, no en `next dev`).
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GuestGuardInner>{children}</GuestGuardInner>
    </Suspense>
  );
}
