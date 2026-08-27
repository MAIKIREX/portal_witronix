"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useSession } from "../hooks/use-session";

/**
 * Protege el arbol de rutas de la aplicacion.
 *
 * AVISO: esto es UX, no seguridad. Los datos los protege NestJS validando el
 * Bearer en cada peticion; sin token no se obtiene nada aunque alguien fuerce
 * la ruta. Este guard solo evita enseñar una pantalla vacia a quien no tiene
 * sesion. NO metas fetch de datos en Server Components creyendo que este guard
 * los protege: el servidor de Next no tiene la sesion.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "anonymous") return;

    // Se conserva el destino para volver a el despues de identificarse.
    const redirect = encodeURIComponent(pathname);
    router.replace(`/login?redirect=${redirect}`);
  }, [status, pathname, router]);

  // Mientras se rehidrata no se decide nada: ni portal ni login.
  if (status === "hydrating") {
    return <LoadingScreen label="Comprobando tu sesion…" />;
  }

  // Ya se ha lanzado la redireccion; no pintar el contenido protegido.
  if (status === "anonymous") {
    return <LoadingScreen label="Redirigiendo…" />;
  }

  return <>{children}</>;
}
