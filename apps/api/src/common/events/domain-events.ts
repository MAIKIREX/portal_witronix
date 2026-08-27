import type { ApprovalStatus, TargetType } from '@prisma/client';

/**
 * Eventos de dominio.
 *
 * Los servicios de negocio emiten estos eventos y el modulo de
 * notificaciones decide a quien avisar. Sin esta separacion,
 * renders.service acabaria sabiendo de plantillas de email y
 * de destinatarios, que no es asunto suyo.
 */

export const EVENTS = {
  FILE_VERSION_PUBLISHED: 'file.version.published',
  RENDER_VERSION_PUBLISHED: 'render.version.published',
  COMMENT_CREATED: 'comment.created',
  APPROVAL_REQUESTED: 'approval.requested',
  APPROVAL_DECIDED: 'approval.decided',
  MEMBER_ADDED: 'project.member.added',
} as const;

export interface VersionPublishedEvent {
  projectId: string;
  containerId: string;
  containerName: string;
  versionId: string;
  version: number;
  actorId: string;
  isVisibleToClient: boolean;
}

export interface CommentCreatedEvent {
  projectId: string;
  commentId: string;
  authorId: string;
  body: string;
  targetType: TargetType;
  targetId: string;
  parentId: string | null;
  isInternal: boolean;
}

export interface ApprovalRequestedEvent {
  projectId: string;
  approvalId: string;
  targetType: TargetType;
  targetId: string;
  targetLabel: string;
  requestedById: string;
}

export interface ApprovalDecidedEvent {
  projectId: string;
  approvalId: string;
  targetLabel: string;
  status: ApprovalStatus;
  decidedById: string;
  comment: string | null;
}

export interface MemberAddedEvent {
  projectId: string;
  projectName: string;
  userId: string;
  addedById: string;
}
