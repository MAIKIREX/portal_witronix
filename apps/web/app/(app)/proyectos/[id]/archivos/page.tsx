"use client";

import { use } from "react";
import { FilesList } from "@/features/files/components/files-list";

export default function FilesPage(props: PageProps<"/proyectos/[id]/archivos">) {
  const { id } = use(props.params);
  return <FilesList projectId={id} />;
}
