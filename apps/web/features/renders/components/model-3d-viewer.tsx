"use client";

import { useEffect, useState } from "react";
import { Box, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Visor de modelos 3D (.glb / glTF binario).
 *
 * Usa <model-viewer> de @google/model-viewer, un web component que carga
 * three.js por dentro. El import de "@google/model-viewer" es de efecto
 * secundario: registra el elemento personalizado <model-viewer> en el
 * navegador la primera vez que se importa, por eso va suelto y sin nombre.
 *
 * Debe cargarse solo en cliente: registra un custom element contra `window`,
 * que no existe durante el renderizado en servidor.
 */
export function Model3DViewer({
  src,
  alt,
  onRenew,
  className,
}: {
  src: string;
  alt: string;
  onRenew?: () => void;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // `error` ya empieza en false; no hace falta reafirmarlo aqui (eso
    // dispararia el aviso de la regla set-state-in-effect sin necesidad).
    import("@google/model-viewer")
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div
        className={cn(
          "bg-muted flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center",
          className,
        )}
      >
        <Box className="text-muted-foreground size-5" />
        <p className="text-muted-foreground text-xs">
          No se pudo cargar el visor 3D
        </p>
        {onRenew && (
          <Button variant="outline" size="xs" onClick={onRenew}>
            <RefreshCw />
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center rounded-lg",
          className,
        )}
      >
        <Box className="text-muted-foreground size-6 animate-pulse" />
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      loading="eager"
      onError={() => setError(true)}
      className={cn("size-full rounded-lg bg-neutral-100", className)}
      // El propio componente pinta su fondo; sin esto la escena se ve
      // recortada dentro del marco.
      style={{ width: "100%", height: "100%" }}
    />
  );
}
