"use client";

import { useState } from "react";
import Link from "next/link";
import { TargetType } from "@witronix/shared";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { FILE_CATEGORY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { useComments } from "@/features/comments/hooks/use-comments";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentThreadCard } from "@/features/comments/components/comment-thread";
import { RequestApprovalButton } from "@/features/approvals/components/request-approval-button";
import { filesApi } from "../api";
import { useFileView } from "../hooks/use-file-view";
import type { FileDetail, FileVersionWithAuthor } from "../types";
import { detectDocumentKind, type DocumentKind } from "./document-media";
import { DocumentPreviewDialog } from "./document-preview-dialog";
import { DownloadButton } from "./download-button";
import { UploadFileVersionDialog } from "./upload-file-version-dialog";

export function FileDetailView({
  projectId,
  fileId,
}: {
  projectId: string;
  fileId: string;
}) {
  const { data, error, isLoading, refetch } = useApi<FileDetail>(
    (signal) => filesApi.detail(fileId, signal),
    [fileId],
  );

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      skeleton={<ViewerSkeleton />}
    >
      {(file) => (
        <DocumentContent
          file={file}
          projectId={projectId}
          onChanged={refetch}
        />
      )}
    </DataState>
  );
}

function DocumentContent({
  file,
  projectId,
  onChanged,
}: {
  file: FileDetail;
  projectId: string;
  onChanged: () => Promise<void>;
}) {
  const { canUpload } = usePermissions();

  // `undefined` significa "la versión actual". Al pulsar otra versión se guarda su id
  // y se pide la URL firmada correspondiente.
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const view = useFileView(file.id, selectedId);

  const selected: FileVersionWithAuthor | undefined = selectedId
    ? file.versions.find((v) => v.id === selectedId)
    : file.versions.find((v) => v.id === file.currentVersionId) ??
      file.versions[0];

  const kind = detectDocumentKind(selected?.mimeType, selected?.originalName);

  // Los comentarios se asocian a la versión concreta del documento
  const comments = useComments({
    projectId,
    targetType: TargetType.FILE_VERSION,
    targetId: selected?.id,
  });

  const threads = comments.data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Modal de previsualización a pantalla completa (dentro del portal) */}
      {selected && (
        <DocumentPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          url={view.data?.url}
          filename={selected.originalName}
          mimeType={selected.mimeType}
          version={selected.version}
          onRenew={view.renew}
        />
      )}

      {/* Barra superior de navegación y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/proyectos/${projectId}/archivos`} />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" />
          Volver a documentos
        </Button>

        <div className="flex items-center gap-2">
          {selected && (
            <RequestApprovalButton
              projectId={projectId}
              targetType={TargetType.FILE_VERSION}
              targetId={selected.id}
              label={`Aprobar V${selected.version}`}
            />
          )}
          {canUpload && (
            <UploadFileVersionDialog fileId={file.id} onUploaded={onChanged} />
          )}
        </div>
      </div>

      {/* Estructura en 2 columnas: Ficha técnica y comentarios a la izquierda, información y versiones a la derecha */}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6 min-w-0">
          {/* Ficha Ejecutiva del Documento (Versión Activa) */}
          {selected && (
            <Card className="border shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Icono representativo del formato */}
                  <div className="rounded-xl bg-primary/10 p-4 shrink-0 text-primary">
                    <DocumentKindIcon kind={kind} className="size-8 sm:size-10" />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
                        V{selected.version}
                        {selected.id === file.currentVersionId && " (actual)"}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground uppercase">
                        {kind}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatBytes(selected.sizeBytes)}
                      </span>
                    </div>

                    <h2 className="font-heading text-xl font-semibold text-foreground break-all">
                      {selected.originalName}
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      Subido por <span className="font-medium text-foreground">{selected.uploadedBy.name}</span> el {formatDateTime(selected.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Notas de la versión si existen */}
                {selected.notes && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                    <p className="text-xs font-semibold text-primary">
                      Notas del cambio (V{selected.version}):
                    </p>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                      &ldquo;{selected.notes}&rdquo;
                    </p>
                  </div>
                )}

                {/* Barra de acciones principales para el cliente / equipo */}
                <div className="pt-2 border-t flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => setPreviewOpen(true)}
                    disabled={!view.data?.url}
                  >
                    <Eye className="size-4" />
                    Previsualizar documento
                  </Button>

                  {view.data?.url && (
                    <Button
                      variant="outline"
                      render={
                        <a
                          href={view.data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                      nativeButton={false}
                    >
                      <ExternalLink className="size-4" />
                      Abrir en pestaña nueva
                    </Button>
                  )}

                  <DownloadButton
                    fileId={file.id}
                    versionId={selected.id}
                    variant="outline"
                    label="Descargar archivo"
                    icon={<Download className="size-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección de comentarios vinculados a la versión activa */}
          {selected && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">
                  Comentarios de la versión {selected.version}
                  {threads.length > 0 ? ` (${threads.length})` : ""}
                </h3>
              </div>

              <CommentComposer
                projectId={projectId}
                targetType={TargetType.FILE_VERSION}
                targetId={selected.id}
                onCreated={comments.refetch}
                compact
              />

              {threads.length > 0 && (
                <div className="space-y-3 pt-2">
                  {threads.map((thread) => (
                    <CommentThreadCard
                      key={thread.id}
                      thread={thread}
                      projectId={projectId}
                      onChanged={comments.refetch}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Panel lateral: Metadatos del documento y selector de versiones */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <div>
                <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
                  {FILE_CATEGORY_LABELS[file.category]}
                </span>
                <h2 className="font-heading text-lg font-semibold text-foreground pt-0.5">
                  {file.name}
                </h2>
              </div>

              {file.description && (
                <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                  {file.description}
                </p>
              )}

              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                {!file.isVisibleToClient && (
                  <p className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <EyeOff className="size-3.5" />
                    Borrador interno (no visible para cliente)
                  </p>
                )}
                <p>Creado por {file.createdBy.name}</p>
                <p>Fecha de alta: {formatDateTime(file.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Historial de versiones interactivo */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Layers className="size-4 text-muted-foreground" />
                  Versiones ({file.versions.length})
                </h3>
              </div>

              <ul className="space-y-1.5">
                {file.versions.map((version) => {
                  const isSelected = selected?.id === version.id;
                  const isCurrent = version.id === file.currentVersionId;

                  return (
                    <li key={version.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedId(isCurrent ? undefined : version.id)
                        }
                        className={cn(
                          "w-full rounded-md p-2.5 text-left text-sm transition-colors border",
                          isSelected
                            ? "bg-primary/5 border-primary/40 font-medium shadow-xs"
                            : "border-transparent hover:bg-muted/60 hover:border-border",
                        )}
                        aria-current={isSelected ? "true" : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">
                              V{version.version}
                            </span>
                            {isCurrent && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                actual
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {formatBytes(version.sizeBytes)}
                          </span>
                        </div>

                        <p className="text-muted-foreground truncate text-xs mt-1">
                          {version.originalName}
                        </p>

                        <p className="text-muted-foreground/80 text-[11px] mt-0.5">
                          {formatDateTime(version.createdAt)} · {version.uploadedBy.name}
                        </p>

                        {version.notes && (
                          <p className="text-muted-foreground/90 mt-1 line-clamp-2 text-[11px] italic bg-muted/40 rounded px-1.5 py-0.5">
                            &ldquo;{version.notes}&rdquo;
                          </p>
                        )}
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

function DocumentKindIcon({
  kind,
  className,
}: {
  kind: DocumentKind;
  className?: string;
}) {
  switch (kind) {
    case "pdf":
      return <FileText className={className} />;
    case "image":
      return <ImageIcon className={className} />;
    case "cad":
      return <Layers className={className} />;
    case "spreadsheet":
      return <FileSpreadsheet className={className} />;
    case "archive":
      return <FileArchive className={className} />;
    case "text":
      return <FileCode className={className} />;
    default:
      return <FileText className={className} />;
  }
}

function ViewerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-[650px] w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
