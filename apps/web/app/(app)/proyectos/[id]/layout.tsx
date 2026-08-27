"use client";

import { use } from "react";
import { ProjectShell } from "@/features/projects/components/project-shell";

/**
 * En Next 16 `params` es una Promise; en un Client Component se desenvuelve
 * con `use()`. `LayoutProps<'/proyectos/[id]'>` es un helper global generado
 * por Next, no hay que importarlo.
 */
export default function ProjectLayout(props: LayoutProps<"/proyectos/[id]">) {
  const { id } = use(props.params);
  return <ProjectShell projectId={id}>{props.children}</ProjectShell>;
}
