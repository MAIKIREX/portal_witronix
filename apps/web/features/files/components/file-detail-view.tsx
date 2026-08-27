"use client";

import Link from "next/link";
import { ArrowLeft, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { FILE_CATEGORY_LABELS } from "@/lib/labels";
import { filesApi } from "../api";
import type { FileDetail } from "../types";
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
  const { canUpload } = usePermissions();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/proyectos/${projectId}/archivos`} />}
          nativeButton={false}
        >
          <ArrowLeft />
          Volver a documentos
        </Button>
        {canUpload && data && (
          <UploadFileVersionDialog fileId={data.id} onUploaded={refetch} />
        )}
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={<Skeleton className="h-72 w-full rounded-lg" />}
      >
        {(file) => (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <Card>
              <CardContent className="space-y-4">
                <h2 className="text-sm font-medium">
                  Versiones ({file.versions.length})
                </h2>
                <ul className="divide-y">
                  {file.versions.map((version) => (
                    <li
                      key={version.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          V{version.version}
                          {version.id === file.currentVersionId && (
                            <span className="text-muted-foreground ml-1.5 text-xs">
                              actual
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {version.originalName} ·{" "}
                          {formatBytes(version.sizeBytes)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(version.createdAt)} ·{" "}
                          {version.uploadedBy.name}
                        </p>
                        {version.notes && (
                          <p className="text-muted-foreground mt-1 text-xs italic">
                            {version.notes}
                          </p>
                        )}
                      </div>
                      <DownloadButton
                        fileId={file.id}
                        versionId={version.id}
                        variant="outline"
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <aside className="space-y-4">
              <Card>
                <CardContent className="space-y-2">
                  <h2 className="font-heading text-lg font-semibold">
                    {file.name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {FILE_CATEGORY_LABELS[file.category]}
                  </p>
                  {file.description && (
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                      {file.description}
                    </p>
                  )}
                  {!file.isVisibleToClient && (
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <EyeOff className="size-3.5" />
                      No visible para el cliente
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Subido por {file.createdBy.name}
                  </p>
                </CardContent>
              </Card>

              {file.currentVersion && (
                <DownloadButton
                  fileId={file.id}
                  variant="outline"
                  label="Descargar version actual"
                />
              )}
            </aside>
          </div>
        )}
      </DataState>
    </div>
  );
}
