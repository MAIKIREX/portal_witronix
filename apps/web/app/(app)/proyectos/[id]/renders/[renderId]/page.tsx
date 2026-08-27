"use client";

import { use } from "react";
import { RenderViewer } from "@/features/renders/components/render-viewer";

export default function RenderDetailPage(
  props: PageProps<"/proyectos/[id]/renders/[renderId]">,
) {
  const { id, renderId } = use(props.params);
  return <RenderViewer projectId={id} renderId={renderId} />;
}
