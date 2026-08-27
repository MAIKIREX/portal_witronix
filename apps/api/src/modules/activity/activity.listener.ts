import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TargetType } from '@prisma/client';
import { ActivityService } from './activity.service';
import {
  EVENTS,
  type ApprovalDecidedEvent,
  type ApprovalRequestedEvent,
  type CommentCreatedEvent,
  type MemberAddedEvent,
  type VersionPublishedEvent,
} from '../../common/events/domain-events';

/**
 * Alimenta la linea de tiempo desde los eventos de dominio.
 *
 * Al colgar de los eventos y no de llamadas manuales en cada servicio,
 * no hay forma de olvidarse de registrar algo al anadir un modulo nuevo.
 */
@Injectable()
export class ActivityListener {
  constructor(private readonly activity: ActivityService) {}

  @OnEvent(EVENTS.FILE_VERSION_PUBLISHED)
  async onFile(e: VersionPublishedEvent): Promise<void> {
    await this.activity.record({
      projectId: e.projectId,
      actorId: e.actorId,
      action: 'file.version.published',
      targetType: TargetType.FILE_VERSION,
      targetId: e.versionId,
      targetLabel: `${e.containerName} V${e.version}`,
      metadata: { version: e.version, fileId: e.containerId },
    });
  }

  @OnEvent(EVENTS.RENDER_VERSION_PUBLISHED)
  async onRender(e: VersionPublishedEvent): Promise<void> {
    await this.activity.record({
      projectId: e.projectId,
      actorId: e.actorId,
      action: 'render.version.published',
      targetType: TargetType.RENDER_VERSION,
      targetId: e.versionId,
      targetLabel: `${e.containerName} V${e.version}`,
      metadata: { version: e.version, renderId: e.containerId },
    });
  }

  @OnEvent(EVENTS.COMMENT_CREATED)
  async onComment(e: CommentCreatedEvent): Promise<void> {
    await this.activity.record({
      projectId: e.projectId,
      actorId: e.authorId,
      action: e.parentId ? 'comment.replied' : 'comment.created',
      targetType: TargetType.COMMENT,
      targetId: e.commentId,
      targetLabel: e.body.slice(0, 80),
      metadata: { isInternal: e.isInternal, anchored: e.targetType },
    });
  }

  @OnEvent(EVENTS.APPROVAL_REQUESTED)
  async onApprovalRequested(e: ApprovalRequestedEvent): Promise<void> {
    await this.activity.record({
      projectId: e.projectId,
      actorId: e.requestedById,
      action: 'approval.requested',
      targetType: e.targetType,
      targetId: e.targetId,
      targetLabel: e.targetLabel,
    });
  }

  @OnEvent(EVENTS.APPROVAL_DECIDED)
  async onApprovalDecided(e: ApprovalDecidedEvent): Promise<void> {
    await this.activity.record({
      projectId: e.projectId,
      actorId: e.decidedById,
      action: `approval.${e.status.toLowerCase()}`,
      targetId: e.approvalId,
      targetLabel: e.targetLabel,
      metadata: { status: e.status, comment: e.comment },
    });
  }

  @OnEvent(EVENTS.MEMBER_ADDED)
  async onMember(e: MemberAddedEvent): Promise<void> {
    await this.activity.record({
      projectId: e.projectId,
      actorId: e.addedById,
      action: 'project.member.added',
      targetId: e.userId,
      targetLabel: e.projectName,
    });
  }
}
