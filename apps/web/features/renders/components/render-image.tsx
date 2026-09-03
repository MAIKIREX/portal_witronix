"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Imagen de un render servida con URL firmada.
 *
 * Se usa <img> y NO next/image a proposito: las URLs de MinIO caducan en 300 s
 * y el optimizador de Next las cachearia, sirviendo despues un enlace muerto.
 *
 * Si la carga falla se intenta UNA vez renovar la URL (el caso habitual es que
 * haya caducado con la pestana en segundo plano). Si vuelve a fallar, el objeto
 * no esta en el almacenamiento y se muestra un aviso, no el icono de imagen
 * rota del navegador.
 */
export function RenderImage({
  src,
  alt,
  onRenew,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  onRenew?: () => void;
  className?: string;
  imageClassName?: string;
}) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [shownSrc, setShownSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const retried = useRef(false);

  // Reinicio al cambiar de URL, hecho DURANTE el render y no en un efecto:
  // con un efecto el orden se invierte y acabaria devolviendo a "loading" un
  // estado de error que ya se habia registrado.
  if (src !== shownSrc) {
    setShownSrc(src);
    setState("loading");
    retried.current = false;
  }

  const fail = useCallback(() => {
    // Primer fallo: lo mas probable es que la URL firmada haya caducado, asi
    // que se pide una nueva antes de dar la imagen por perdida.
    if (!retried.current && onRenew) {
      retried.current = true;
      onRenew();
      return;
    }
    setState("error");
  }, [onRenew]);

  // Si la imagen falla ANTES de que React monte el manejador onError, el evento
  // se pierde y el componente se queda cargando para siempre. Contra un
  // almacenamiento local el 404 llega en milisegundos, asi que pasa a menudo.
  // Se comprueba el estado real del elemento tras cada cambio de URL:
  // `complete` con `naturalWidth` a cero significa que ya fallo.
  useEffect(() => {
    const node = imgRef.current;
    if (!node || !node.complete) return;
    if (node.naturalWidth === 0) fail();
    else setState("ok");
  }, [shownSrc, fail]);

  if (state === "error") {
    return (
      <div
        className={cn(
          "bg-muted flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center",
          className,
        )}
      >
        <ImageOff className="text-muted-foreground size-5" />
        <p className="text-muted-foreground text-xs">
          No se pudo cargar la imagen
        </p>
        {onRenew && (
          <Button
            variant="outline"
            size="xs"
            onClick={(event) => {
              // La tarjeta entera es un enlace: sin esto, reintentar navegaria.
              event.preventDefault();
              event.stopPropagation();
              retried.current = false;
              setState("loading");
              onRenew();
            }}
          >
            <RefreshCw />
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {state === "loading" && (
        <Skeleton className="absolute inset-0 size-full rounded-lg" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setState("ok")}
        onError={fail}
        className={cn(
          "size-full rounded-lg object-contain transition-opacity",
          state === "ok" ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
      />
    </div>
  );
}
