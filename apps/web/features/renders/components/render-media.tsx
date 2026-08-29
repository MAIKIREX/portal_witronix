"use client";

import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaKindFor } from "../media-type";
import { Model3DViewer } from "./model-3d-viewer";
import { RenderImage } from "./render-image";
import { VideoPlayer } from "./video-player";

/**
 * Reparte entre los distintos visores segun el MIME real de la version.
 *
 * Es el UNICO sitio que decide "que componente pinta esto": tanto la
 * miniatura de la rejilla como el visor grande pasan por aqui, para que
 * anadir un formato nuevo (por ejemplo audio) sea un cambio en un solo
 * archivo.
 */
export function RenderMedia({
  mimeType,
  src,
  alt,
  filename,
  thumbnailUrl,
  onRenew,
  className,
  imageClassName,
}: {
  mimeType: string | null | undefined;
  src: string;
  alt: string;
  filename?: string | null;
  thumbnailUrl?: string | null;
  onRenew?: () => void;
  className?: string;
  imageClassName?: string;
}) {
  const kind = mediaKindFor(mimeType, filename ?? src);

  if (kind === "video") {
    return (
      <VideoPlayer
        src={src}
        poster={thumbnailUrl}
        onRenew={onRenew}
        className={className}
      />
    );
  }

  if (kind === "model3d") {
    return (
      <Model3DViewer src={src} alt={alt} onRenew={onRenew} className={className} />
    );
  }

  if (kind === "image") {
    return (
      <RenderImage
        src={thumbnailUrl ?? src}
        alt={alt}
        onRenew={onRenew}
        className={className}
        imageClassName={imageClassName}
      />
    );
  }

  // Formatos tecnicos (CAD, fotometria) sin visor dedicado: no tiene sentido
  // intentar mostrarlos, se ofrece descargar en su lugar desde el propio
  // visor (el boton de descarga ya existe en RenderViewer).
  return (
    <div
      className={cn(
        "bg-muted flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center",
        className,
      )}
    >
      <FileQuestion className="text-muted-foreground size-5" />
      <p className="text-muted-foreground text-xs">
        Este archivo no tiene vista previa. Descargalo para verlo.
      </p>
    </div>
  );
}
