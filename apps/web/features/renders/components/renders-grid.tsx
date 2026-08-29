"use client";

import Link from "next/link";
import { Images, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { ApprovalStatusBadge } from "@/components/common/status-badge";
import { formatRelative } from "@/lib/format";
import { RENDER_TYPE_LABELS } from "@/lib/labels";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { useRenders } from "../hooks/use-renders";
import type { RenderListItem } from "../types";
import { RenderThumbnail } from "./render-thumbnail";
import { UploadRenderDialog } from "./upload-render-dialog";

export function RendersGrid({ projectId }: { projectId: string }) {
  const { data, error, isLoading, refetch } = useRenders(projectId);
  const { canUpload } = usePermissions();

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="flex justify-end">
          <UploadRenderDialog projectId={projectId} onUploaded={refetch} />
        </div>
      )}

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={<GridSkeleton />}
        isEmpty={(d) => d.data.length === 0}
        empty={
          <EmptyState
            icon={Images}
            title="Todavia no hay renders"
            description={
              canUpload
                ? "Sube el primer render para que el cliente pueda revisarlo."
                : "Cuando el equipo suba renders apareceran aqui."
            }
          />
        }
      >
        {(page) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.data.map((render) => (
              <RenderCard
                key={render.id}
                render={render}
                projectId={projectId}
              />
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}

function RenderCard({
  render,
  projectId,
}: {
  render: RenderListItem;
  projectId: string;
}) {
  return (
    <Link
      href={`/proyectos/${projectId}/renders/${render.id}`}
      className="hover:border-primary/40 group block overflow-hidden rounded-lg border transition-colors"
    >
      <RenderThumbnail
        renderId={render.id}
        title={render.title}
        mimeType={render.currentVersion?.mimeType}
        filename={render.currentVersion?.originalName}
      />

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="group-hover:text-primary truncate font-medium transition-colors">
              {render.title}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {RENDER_TYPE_LABELS[render.type]}
              {render.area ? ` · ${render.area}` : ""}
            </p>
          </div>
          {render.currentVersion && (
            <ApprovalStatusBadge status={render.currentVersion.status} />
          )}
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" />
            {render._count.versions} version
            {render._count.versions === 1 ? "" : "es"}
          </span>
          <span>{formatRelative(render.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-lg" />
      ))}
    </div>
  );
}
