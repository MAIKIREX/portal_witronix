"use client";

import { use } from "react";
import { ActivityFeed } from "@/features/activity/components/activity-feed";

export default function ActivityPage(
  props: PageProps<"/proyectos/[id]/actividad">,
) {
  const { id } = use(props.params);
  return <ActivityFeed projectId={id} />;
}
