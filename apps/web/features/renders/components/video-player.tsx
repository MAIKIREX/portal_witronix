"use client";

import { useRef, useState } from "react";
import { RefreshCw, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Reproductor de video para renders subidos como .mp4/.webm/.mov.
 *
 * Igual que RenderImage, un fallo de carga intenta renovar la URL firmada UNA
 * vez antes de mostrar el aviso de error: la causa mas probable es que haya
 * caducado (300 s) mientras la pestana estaba en segundo plano.
 */
export function VideoPlayer({
  src,
  poster,
  onRenew,
  className,
}: {
  src: string;
  poster?: string | null;
  onRenew?: () => void;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const [shownSrc, setShownSrc] = useState(src);
  const retried = useRef(false);

  if (src !== shownSrc) {
    setShownSrc(src);
    setError(false);
    retried.current = false;
  }

  function handleError() {
    if (!retried.current && onRenew) {
      retried.current = true;
      onRenew();
      return;
    }
    setError(true);
  }

  if (error) {
    return (
      <div
        className={cn(
          "bg-muted flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center",
          className,
        )}
      >
        <VideoOff className="text-muted-foreground size-5" />
        <p className="text-muted-foreground text-xs">
          No se pudo cargar el video
        </p>
        {onRenew && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              retried.current = false;
              setError(false);
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
    <video
      key={src}
      src={src}
      poster={poster ?? undefined}
      controls
      preload="metadata"
      onError={handleError}
      className={cn("size-full rounded-lg bg-black", className)}
    >
      Tu navegador no admite la reproduccion de video.
    </video>
  );
}
