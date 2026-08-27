"use client";

import { use } from "react";
import { FileDetailView } from "@/features/files/components/file-detail-view";

/**
 * El backend enlaza aqui desde los correos de notificacion
 * (`/proyectos/{projectId}/archivos/{fileId}`).
 */
export default function FileDetailPage(
  props: PageProps<"/proyectos/[id]/archivos/[fileId]">,
) {
  const { id, fileId } = use(props.params);
  return <FileDetailView projectId={id} fileId={fileId} />;
}
