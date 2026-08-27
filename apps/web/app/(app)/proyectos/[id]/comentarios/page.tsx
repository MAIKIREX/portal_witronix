"use client";

import { use } from "react";
import { ProjectComments } from "@/features/comments/components/project-comments";

export default function CommentsPage(
  props: PageProps<"/proyectos/[id]/comentarios">,
) {
  const { id } = use(props.params);
  return <ProjectComments projectId={id} />;
}
