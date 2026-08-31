import { ApprovalStatus, ProjectStatus } from "@witronix/shared";
import {
  CheckCircle2,
  Clock,
  Eye,
  GitBranch,
  Hammer,
  Palette,
  PauseCircle,
  PenLine,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  TONE_CLASSES,
  type Tone,
} from "@/lib/labels";

const PROJECT_ICONS: Record<ProjectStatus, LucideIcon> = {
  [ProjectStatus.POR_INICIAR]: PauseCircle,
  [ProjectStatus.EN_DISENO]: Palette,
  [ProjectStatus.ESPERANDO_CLIENTE]: Clock,
  [ProjectStatus.APROBADO]: CheckCircle2,
  [ProjectStatus.EN_INSTALACION]: Hammer,
  [ProjectStatus.FINALIZADO]: Sparkles,
  [ProjectStatus.CANCELADO]: XCircle,
};

const APPROVAL_ICONS: Record<ApprovalStatus, LucideIcon> = {
  [ApprovalStatus.PENDIENTE]: Clock,
  [ApprovalStatus.EN_REVISION]: Eye,
  [ApprovalStatus.CAMBIOS_SOLICITADOS]: PenLine,
  [ApprovalStatus.NUEVA_VERSION]: GitBranch,
  [ApprovalStatus.APROBADO]: CheckCircle2,
  [ApprovalStatus.RECHAZADO]: XCircle,
};

/**
 * Distintivo de estado.
 * Diseñado con fondos sólidos notables, micro-íconos de contexto,
 * resaltado de bordes y tipografía en warm silver / blanco cálido de alta legibilidad.
 */
function Badge({
  tone,
  icon: Icon,
  className,
  children,
}: {
  tone: Tone;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap tracking-wide ring-1 ring-inset ring-white/15 transition-all duration-150 select-none",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3 shrink-0 opacity-95 stroke-[2.3]" aria-hidden="true" />}
      <span className="leading-none">{children}</span>
    </span>
  );
}

export function ProjectStatusBadge({
  status,
  className,
  showIcon = true,
  count,
}: {
  status: ProjectStatus;
  className?: string;
  showIcon?: boolean;
  count?: number;
}) {
  return (
    <Badge
      tone={PROJECT_STATUS_TONES[status]}
      icon={showIcon ? PROJECT_ICONS[status] : undefined}
      className={className}
    >
      <span>{PROJECT_STATUS_LABELS[status]}</span>
      {count !== undefined && (
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-black/20 dark:bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none">
          {count}
        </span>
      )}
    </Badge>
  );
}

export function ApprovalStatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: ApprovalStatus;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <Badge
      tone={APPROVAL_STATUS_TONES[status]}
      icon={showIcon ? APPROVAL_ICONS[status] : undefined}
      className={className}
    >
      {APPROVAL_STATUS_LABELS[status]}
    </Badge>
  );
}
