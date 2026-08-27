"use client";

import { cn } from "@/lib/utils";
import type { CommentThread } from "../types";

export interface AnchorPoint {
  x: number;
  y: number;
}

/**
 * Capa de marcas ancladas sobre un render.
 *
 * CLAVE DEL POSICIONAMIENTO: las coordenadas del backend son relativas a la
 * IMAGEN (0-1), no al contenedor. Si el contenedor fuera mas ancho o mas alto
 * que la imagen, `object-contain` dejaria franjas vacias a los lados y un
 * ancla en 0,5 caeria fuera del punto real: se veria "casi bien", que es lo
 * peor que puede pasar.
 *
 * Por eso quien use esta capa debe fijar al contenedor EXACTAMENTE la
 * proporcion de la imagen (ver <AnchoredImageFrame>), de modo que la imagen lo
 * llene por completo y los porcentajes coincidan pixel a pixel.
 */
export function AnchorLayer({
  threads,
  activeId,
  pending,
  onSelect,
  onPlace,
  placing,
}: {
  threads: CommentThread[];
  activeId?: string | null;
  pending?: AnchorPoint | null;
  onSelect?: (thread: CommentThread) => void;
  /** Si se indica, al pulsar sobre la imagen se coloca un ancla nueva. */
  onPlace?: (point: AnchorPoint) => void;
  placing?: boolean;
}) {
  const anchored = threads.filter(
    (t) => t.anchorX !== null && t.anchorY !== null,
  );

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!onPlace || !placing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    // Se recorta por seguridad: el backend valida el rango 0-1 y un clic en el
    // borde puede dar 1.0000001 por redondeo.
    onPlace({
      x: Math.min(1, Math.max(0, Number(x.toFixed(4)))),
      y: Math.min(1, Math.max(0, Number(y.toFixed(4)))),
    });
  }

  return (
    <div
      className={cn(
        "absolute inset-0",
        placing ? "cursor-crosshair" : "pointer-events-none",
      )}
      onClick={handleClick}
    >
      {anchored.map((thread, index) => {
        const active = thread.id === activeId;
        const resolved = Boolean(thread.resolvedAt);
        return (
          <button
            key={thread.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(thread);
            }}
            style={{
              left: `${thread.anchorX! * 100}%`,
              top: `${thread.anchorY! * 100}%`,
            }}
            className={cn(
              "pointer-events-auto absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold shadow transition-transform hover:scale-110",
              resolved
                ? "bg-tone-success text-tone-success-fg"
                : "bg-primary text-primary-foreground",
              active && "ring-primary scale-110 ring-2 ring-offset-1",
            )}
            aria-label={`Comentario ${index + 1} de ${thread.author.name}`}
          >
            {index + 1}
          </button>
        );
      })}

      {pending && (
        <span
          style={{ left: `${pending.x * 100}%`, top: `${pending.y * 100}%` }}
          className="border-primary bg-primary/30 absolute size-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Marco con la proporcion EXACTA de la imagen, para que las anclas caigan
 * donde deben. Sin dimensiones conocidas se cae a 16/9, que es lo que suele
 * ser un render, y las anclas seguirian siendo aproximadas: por eso el visor
 * solo permite anclar cuando conoce el tamano real.
 */
export function AnchoredImageFrame({
  width,
  height,
  children,
  className,
}: {
  width: number | null;
  height: number | null;
  children: React.ReactNode;
  className?: string;
}) {
  const ratio = width && height ? width / height : 16 / 9;

  return (
    <div
      style={{
        aspectRatio: `${width ?? 16} / ${height ?? 9}`,
        // Se limita SOLO el ancho, nunca el alto.
        //
        // Con `max-height` la proporcion se rompe: el ancho sigue al 100% del
        // contenedor mientras el alto queda recortado, y la imagen aparece con
        // franjas. Las anclas, que se posicionan en porcentaje del marco,
        // dejarian de coincidir con la imagen (el centro seguiria bien, pero
        // todo lo demas se desplazaria: un fallo que se ve "casi bien").
        //
        // Limitando el ancho a la altura maxima multiplicada por la proporcion,
        // el alto nunca pasa de 70vh y la proporcion se mantiene exacta.
        maxWidth: `calc(70vh * ${ratio})`,
      }}
      className={cn("relative mx-auto w-full", className)}
    >
      {children}
    </div>
  );
}
