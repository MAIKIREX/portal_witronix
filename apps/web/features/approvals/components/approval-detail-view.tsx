"use client";

import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/common/states";
import { ApprovalStatusBadge } from "@/components/common/status-badge";
import { useApi } from "@/hooks/use-api";
import { formatDateTime } from "@/lib/format";
import { approvalsApi } from "../api";
import type { ApprovalDetail } from "../types";
import { ApprovalActions } from "./approval-actions";
import { ApprovalTimeline } from "./approval-timeline";

export function ApprovalDetailView({
  projectId,
  approvalId,
}: {
  projectId: string;
  approvalId: string;
}) {
  const { data, error, isLoading, refetch } = useApi<ApprovalDetail>(
    (signal) => approvalsApi.detail(approvalId, signal),
    [approvalId],
  );

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/proyectos/${projectId}/aprobaciones`} />}
        nativeButton={false}
      >
        <ArrowLeft />
        Volver a aprobaciones
      </Button>

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={<Skeleton className="h-80 w-full rounded-lg" />}
      >
        {(approval) => {
          const target = approval.target;
          const targetTitle =
            target?.title ?? approval.targetLabel ?? "Entregable a revisar";
          const version = target?.version;
          const previewImg = target?.viewUrl ?? target?.thumbnailUrl;

          return (
            <div className="space-y-6">
              {/* Entregable a revisar (Vista Previa) */}
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b bg-muted/20 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">
                        {targetTitle}
                      </CardTitle>
                      {version && (
                        <span className="bg-primary/10 text-primary border-primary/20 rounded px-1.5 py-0.5 text-xs font-semibold">
                          V{version}
                        </span>
                      )}
                    </div>
                    {target?.area && (
                      <p className="text-muted-foreground text-xs">
                        Área: {target.area}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {target?.renderId && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/proyectos/${projectId}/renders/${target.renderId}`}
                          />
                        }
                        nativeButton={false}
                      >
                        <ExternalLink className="size-3.5" />
                        Ver en Renders
                      </Button>
                    )}
                    {target?.fileId && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/proyectos/${projectId}/archivos`}
                          />
                        }
                        nativeButton={false}
                      >
                        <ExternalLink className="size-3.5" />
                        Ver en Documentos
                      </Button>
                    )}
                    {target?.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <a
                            href={target.downloadUrl}
                            download={target.originalName ?? "archivo"}
                          />
                        }
                        nativeButton={false}
                      >
                        <Download className="size-3.5" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  {previewImg ? (
                    <div className="bg-muted/40 relative flex max-h-[520px] w-full items-center justify-center overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImg}
                        alt={targetTitle}
                        className="max-h-[500px] w-auto max-w-full rounded-md object-contain shadow-sm"
                      />
                    </div>
                  ) : target?.downloadUrl ? (
                    <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
                      <FileText className="text-muted-foreground size-12" />
                      <div>
                        <p className="text-sm font-medium">
                          {target.originalName ?? targetTitle}
                        </p>
                        {target.sizeBytes && (
                          <p className="text-muted-foreground text-xs">
                            Documento técnico
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        render={
                          <a
                            href={target.downloadUrl}
                            download={target.originalName ?? "archivo"}
                          />
                        }
                        nativeButton={false}
                      >
                        <Download className="size-4" />
                        Descargar para revisión
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-muted/20 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
                      <ImageIcon className="text-muted-foreground size-10" />
                      <p className="text-muted-foreground text-sm">
                        No hay una vista previa disponible directamente para este entregable.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historial y Panel de Decisión */}
              <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <h2 className="text-sm font-medium">Historial y Trazabilidad</h2>
                    <ApprovalTimeline events={approval.events} />
                  </CardContent>
                </Card>

                <aside className="space-y-4">
                  <Card>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-medium">Estado</h2>
                        <ApprovalStatusBadge status={approval.status} />
                      </div>
                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Solicitada por</dt>
                          <dd className="text-right font-medium">
                            {approval.requestedBy.name}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Fecha</dt>
                          <dd className="text-right">
                            {formatDateTime(approval.requestedAt)}
                          </dd>
                        </div>
                        {approval.decidedBy && (
                          <>
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-foreground">Decidida por</dt>
                              <dd className="text-right font-medium">
                                {approval.decidedBy.name}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-foreground">Resuelta</dt>
                              <dd className="text-right">
                                {formatDateTime(approval.decidedAt)}
                              </dd>
                            </div>
                          </>
                        )}
                      </dl>
                      {approval.comment && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">
                            Nota de la solicitud:
                          </span>
                          <p className="bg-muted rounded-md px-2.5 py-2 text-sm whitespace-pre-line">
                            {approval.comment}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-3 pt-6">
                      <h2 className="text-sm font-medium">Tomar Decisión</h2>
                      <ApprovalActions approval={approval} onChanged={refetch} />
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
