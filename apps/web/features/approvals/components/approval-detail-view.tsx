"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        {(approval) => (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <Card>
              <CardContent className="space-y-4">
                <h2 className="text-sm font-medium">Historico</h2>
                <ApprovalTimeline events={approval.events} />
              </CardContent>
            </Card>

            <aside className="space-y-4">
              <Card>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium">Estado</h2>
                    <ApprovalStatusBadge status={approval.status} />
                  </div>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Solicitada por</dt>
                      <dd className="text-right">
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
                          <dd className="text-right">
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
                    <p className="bg-muted rounded-md px-2 py-1.5 text-sm whitespace-pre-line">
                      {approval.comment}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3">
                  <h2 className="text-sm font-medium">Decision</h2>
                  <ApprovalActions approval={approval} onChanged={refetch} />
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </DataState>
    </div>
  );
}
