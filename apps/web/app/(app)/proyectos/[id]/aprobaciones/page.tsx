"use client";

import { use } from "react";
import { ApprovalsList } from "@/features/approvals/components/approvals-list";

export default function ApprovalsPage(
  props: PageProps<"/proyectos/[id]/aprobaciones">,
) {
  const { id } = use(props.params);
  return <ApprovalsList projectId={id} />;
}
