"use client";

import { use } from "react";
import { RendersGrid } from "@/features/renders/components/renders-grid";

export default function RendersPage(
  props: PageProps<"/proyectos/[id]/renders">,
) {
  const { id } = use(props.params);
  return <RendersGrid projectId={id} />;
}
