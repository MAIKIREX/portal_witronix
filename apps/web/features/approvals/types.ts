import type { ApprovalStatus, TargetType } from "@witronix/shared";
import type { PaginationQuery, UserRef } from "@/types/api";

export interface ApprovalTargetSummary {
  id: string;
  targetType: TargetType;
  title: string;
  label?: string;
  version?: number;
  area?: string;
  category?: string;
  renderType?: string;
  renderId?: string;
  fileId?: string;
  mimeType?: string | null;
  originalName?: string | null;
  sizeBytes?: string;
  thumbnailUrl?: string | null;
  viewUrl?: string | null;
  downloadUrl?: string | null;
}

export interface Approval {
  id: string;
  projectId: string;
  targetType: TargetType;
  targetId: string;
  status: ApprovalStatus;
  requestedById: string;
  requestedAt: string;
  decidedById: string | null;
  decidedAt: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy: UserRef;
  decidedBy: UserRef | null;
  target?: ApprovalTargetSummary | null;
  targetLabel?: string;
}

export interface ApprovalListItem extends Approval {
  _count: { events: number };
}

export interface ApprovalEvent {
  id: string;
  approvalId: string;
  /** null en el evento inicial: no se venia de ningun estado. */
  fromStatus: ApprovalStatus | null;
  toStatus: ApprovalStatus;
  actorId: string;
  comment: string | null;
  createdAt: string;
  actor: UserRef;
}

export interface ApprovalDetail extends Approval {
  /** Historico completo, del mas antiguo al mas reciente. */
  events: ApprovalEvent[];
  /**
   * Estados a los que se puede pasar desde el actual, calculado por el backend.
   * ES LA FUENTE DE VERDAD para pintar los botones: no repliques aqui la
   * maquina de estados aunque APPROVAL_TRANSITIONS este disponible en shared.
   */
  transicionesPosibles: ApprovalStatus[];
}

export interface ApprovalQuery extends PaginationQuery {
  status?: ApprovalStatus;
  targetType?: TargetType;
  /** Solo PENDIENTE y EN_REVISION. Si es false, hay que OMITIRLO. */
  pending?: boolean;
}
