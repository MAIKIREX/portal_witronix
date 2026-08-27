"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary global. Obligatoriamente un Client Component.
 * Captura errores de render de todo el arbol de la app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal] error no controlado:", error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold">
          Algo ha ido mal
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Ha ocurrido un error inesperado. Puedes reintentar; si vuelve a
          pasar, avisa al equipo.
        </p>
        {error.digest ? (
          <p className="text-muted-foreground font-mono text-xs">
            ref: {error.digest}
          </p>
        ) : null}
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
