"use client";

import { Box, FileQuestion, ImageIcon, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRenderView } from "../hooks/use-render-view";
import { mediaKindFor, type MediaKind } from "../media-type";
import { RenderImage } from "./render-image";

/**
 * Miniatura de una tarjeta del listado.
 *
 * Solo las imagenes tienen thumbnailKey (el backend genera la miniatura
 * unicamente para MIME image/*, ver renders.service.ts): un video o un
 * modelo 3D nunca lo tendran, asi que no tiene sentido pedir su URL firmada
 * ni intentar pintarlos en un recuadro pequeno. Se resuelven con un icono
 * fijo, barato y sin red.
 */
export function RenderThumbnail({
  renderId,
  title,
  mimeType,
}: {
  renderId: string;
  title: string;
  /** MIME de la version actual, tal como llega en el listado. */
  mimeType: string | null | undefined;
}) {
  const kind = mediaKindFor(mimeType);
  const { data, isLoading, renew } = useRenderView(
    renderId,
    undefined,
    kind === "image",
  );

  if (kind !== "image") {
    return <StaticThumbnail kind={kind} />;
  }

  if (isLoading) {
    return <Skeleton className="aspect-video w-full rounded-none" />;
  }

  if (!data) {
    return <StaticThumbnail kind="image" />;
  }

  return (
    <RenderImage
      src={data.thumbnailUrl ?? data.url}
      alt={`Miniatura de ${title}`}
      onRenew={renew}
      className="bg-muted aspect-video w-full"
      imageClassName="rounded-none object-cover"
    />
  );
}

const ICON_BY_KIND: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  model3d: Box,
  other: FileQuestion,
};

function StaticThumbnail({ kind }: { kind: MediaKind }) {
  const Icon = ICON_BY_KIND[kind];
  return (
    <div className="bg-muted flex aspect-video w-full items-center justify-center">
      <Icon className="text-muted-foreground size-6" />
    </div>
  );
}
