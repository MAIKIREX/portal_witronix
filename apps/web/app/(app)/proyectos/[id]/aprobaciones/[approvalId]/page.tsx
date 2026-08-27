"use client";

import { use } from "react";
import { ApprovalDetailView } from "@/features/approvals/components/approval-detail-view";

export default function ApprovalDetailPage(
  props: PageProps<"/proyectos/[id]/aprobaciones/[approvalId]">,
) {
  const { id, approvalId } = use(props.params);
  return <ApprovalDetailView projectId={id} approvalId={approvalId} />;
}
