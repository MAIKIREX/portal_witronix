"use client";

import { useState } from "react";
import Link from "next/link";
import { TargetType } from "@witronix/shared";
import { ArrowLeft, Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/common/states";
import { ApprovalStatusBadge } from "@/components/common/status-badge";
import { formatBytes, formatDateTime } from "@/lib/format";
import { RENDER_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { useComments } from "@/features/comments/hooks/use-comments";
import {
  AnchorLayer,
  AnchoredImageFrame,
  type AnchorPoint,
} from "@/features/comments/components/anchor-layer";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentThreadCard } from "@/features/comments/components/comment-thread";
import { RequestApprovalButton } from "@/features/approvals/components/request-approval-button";
import { useRender } from "../hooks/use-renders";
import { useRenderView } from "../hooks/use-render-view";
import { mediaKindFor } from "../media-type";
import type { RenderDetail, RenderVersionWithAuthor } from "../types";
import { RenderMedia } from "./render-media";
import { UploadVersionDialog } from "./upload-render-dialog";

export function RenderViewer({
  projectId,
  renderId,
}: {
  projectId: string;
  renderId: string;
}) {
  const { data, error, isLoading, refetch } = useRender(renderId);

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      skeleton={<ViewerSkeleton />}
    >
      {(render) => (
        <RenderContent
          render={render}
          projectId={projectId}
          onChanged={refetch}
        />
      )}
    </DataState>
  );
}

function RenderContent({
  render,
  projectId,
  onChanged,
}: {
  render: RenderDetail;
  projectId: string;
  onChanged: () => Promise<void>;
}) {
  const { canUpload } = usePermissions();

  // `undefined` significa "la version actual". Al elegir una concreta se
  // guarda su id y el visor pide su URL firmada.
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const view = useRenderView(render.id, selectedId);

  const selected: RenderVersionWithAuthor | undefined = selectedId
    ? render.versions.find((v) => v.id === selectedId)
    : render.versions.find((v) => v.id === render.currentVersionId) ??
      render.versions[0];

  // Anclar un punto solo tiene sentido sobre una imagen: un video se mueve en
  // el tiempo y un modelo 3D en el espacio, ninguno tiene una superficie
  // plana estable donde fijar una coordenada 0-1.
  const isImage =
    mediaKindFor(selected?.mimeType, selected?.originalName) === "image";

  // Verificamos que los datos devueltos por useRenderView coincidan con la
  // version seleccionada para evitar condiciones de carrera (por ejemplo, pasar
  // una URL de 3D a un <video> o <img> mientras se descarga la nueva URL firmada).
  const isDataMatching =
    Boolean(view.data && selected && view.data.version === selected.version);

  // Los comentarios se anclan a la VERSION concreta, no al render: cada
  // version tiene sus propias marcas y no se arrastran de una a otra.
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [placingAnchor, setPlacingAnchor] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<AnchorPoint | null>(null);

  const comments = useComments({
    projectId,
    targetType: TargetType.RENDER_VERSION,
    targetId: selected?.id,
  });

  const threads = comments.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/proyectos/${projectId}/renders`} />}
          nativeButton={false}
        >
          <ArrowLeft />
          Volver a renders
        </Button>

        <div className="flex items-center gap-2">
          {selected && (
            <RequestApprovalButton
              projectId={projectId}
              targetType={TargetType.RENDER_VERSION}
              targetId={selected.id}
              label={`Aprobar V${selected.version}`}
            />
          )}
          {canUpload && (
            <UploadVersionDialog renderId={render.id} onUploaded={onChanged} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {isDataMatching && view.data ? (
            isImage ? (
              // El marco lleva la proporcion EXACTA de la imagen para que las
              // anclas caigan en su sitio: con un contenedor de otra
              // proporcion, object-contain dejaria franjas y las marcas se
              // desplazarian. Solo tiene sentido anclar sobre una imagen: un
              // video o un modelo 3D no tienen una superficie plana estable
              // sobre la que fijar un punto en coordenadas 0-1.
              <AnchoredImageFrame
                width={selected?.width ?? view.data.width}
                height={selected?.height ?? view.data.height}
                className="bg-muted overflow-hidden rounded-lg border"
              >
                <RenderMedia
                  mimeType={selected?.mimeType}
                  src={view.data.url}
                  alt={render.title}
                  filename={selected?.originalName}
                  onRenew={view.renew}
                  className="size-full"
                  imageClassName="rounded-none"
                />
                <AnchorLayer
                  threads={threads}
                  activeId={activeThreadId}
                  pending={pendingAnchor}
                  placing={placingAnchor}
                  onPlace={(point) => {
                    setPendingAnchor(point);
                    setPlacingAnchor(false);
                  }}
                  onSelect={(thread) => setActiveThreadId(thread.id)}
                />
              </AnchoredImageFrame>
            ) : (
              <div className="bg-muted flex min-h-96 items-center justify-center overflow-hidden rounded-lg border">
                <RenderMedia
                  mimeType={selected?.mimeType}
                  src={view.data.url}
                  alt={render.title}
                  filename={selected?.originalName}
                  onRenew={view.renew}
                  className="size-full min-h-96"
                />
              </div>
            )
          ) : (
            <Skeleton className="h-96 w-full rounded-lg" />
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            {selected && (
              <>
                <span>Version {selected.version}</span>
                <span>{formatBytes(selected.sizeBytes)}</span>
                {selected.width && selected.height && (
                  <span>
                    {selected.width} × {selected.height} px
                  </span>
                )}
                <span>{selected.originalName}</span>
              </>
            )}
            {view.data && (
              <Button
                variant="ghost"
                size="xs"
                render={
                  <a
                    href={view.data.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                  />
                }
                nativeButton={false}
              >
                <Download />
                Descargar
              </Button>
            )}
          </div>

          {selected && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  Comentarios de la version {selected.version}
                  {threads.length > 0 ? ` (${threads.length})` : ""}
                </h3>
                {isImage && (
                  <Button
                    variant={placingAnchor ? "secondary" : "outline"}
                    size="xs"
                    onClick={() => {
                      setPlacingAnchor((v) => !v);
                      setPendingAnchor(null);
                    }}
                    aria-pressed={placingAnchor}
                  >
                    <MapPin />
                    {placingAnchor
                      ? "Pulsa en la imagen…"
                      : "Comentar un punto"}
                  </Button>
                )}
              </div>

              <CommentComposer
                projectId={projectId}
                targetType={TargetType.RENDER_VERSION}
                targetId={selected.id}
                anchor={pendingAnchor}
                onClearAnchor={() => setPendingAnchor(null)}
                onCreated={comments.refetch}
                compact
              />

              {threads.length > 0 && (
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <CommentThreadCard
                      key={thread.id}
                      thread={thread}
                      projectId={projectId}
                      highlighted={thread.id === activeThreadId}
                      onFocusAnchor={(t) => setActiveThreadId(t.id)}
                      onChanged={comments.refetch}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-2">
              <h2 className="font-heading text-lg font-semibold">
                {render.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {RENDER_TYPE_LABELS[render.type]}
                {render.area ? ` · ${render.area}` : ""}
              </p>
              {render.description && (
                <p className="text-muted-foreground text-sm whitespace-pre-line">
                  {render.description}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Subido por {render.createdBy.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h3 className="text-sm font-medium">
                Versiones ({render.versions.length})
              </h3>
              <ul className="space-y-1">
                {render.versions.map((version) => {
                  const isSelected = selected?.id === version.id;
                  const isCurrent = version.id === render.currentVersionId;
                  return (
                    <li key={version.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedId(isCurrent ? undefined : version.id)
                        }
                        className={cn(
                          "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-muted font-medium"
                            : "hover:bg-muted/60",
                        )}
                        aria-current={isSelected ? "true" : undefined}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span>
                            V{version.version}
                            {isCurrent && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                actual
                              </span>
                            )}
                          </span>
                          <ApprovalStatusBadge status={version.status} />
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {formatDateTime(version.createdAt)} ·{" "}
                          {version.uploadedBy.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <Skeleton className="h-96 w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}
