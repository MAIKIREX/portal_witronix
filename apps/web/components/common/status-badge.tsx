import type { ApprovalStatus, ProjectStatus } from "@witronix/shared";
import { cn } from "@/lib/utils";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  TONE_CLASSES,
} from "@/lib/labels";

/**
 * Distintivo de estado. El color sale siempre de lib/labels.ts, nunca de
 * clases sueltas en las pantallas, para que un estado tenga el mismo color
 * en toda la aplicacion.
 */
function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={TONE_CLASSES[PROJECT_STATUS_TONES[status]]}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge className={TONE_CLASSES[APPROVAL_STATUS_TONES[status]]}>
      {APPROVAL_STATUS_LABELS[status]}
    </Badge>
  );
}
