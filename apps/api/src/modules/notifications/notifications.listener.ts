import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ApprovalStatus, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import {
  EVENTS,
  type ApprovalDecidedEvent,
  type ApprovalRequestedEvent,
  type CommentCreatedEvent,
  type MemberAddedEvent,
  type VersionPublishedEvent,
} from '../../common/events/domain-events';

/**
 * Traduce eventos de dominio en notificaciones.
 *
 * Vive aparte de los servicios de negocio a proposito: renders.service no
 * tiene por que saber a quien hay que avisar ni con que texto. Anadir un
 * canal nuevo (WhatsApp, por ejemplo) se hace aqui y en ningun sitio mas.
 */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(EVENTS.FILE_VERSION_PUBLISHED)
  async onFilePublished(event: VersionPublishedEvent): Promise<void> {
    const esPrimera = event.version === 1;
    await this.notifyProject({
      projectId: event.projectId,
      exceptUserId: event.actorId,
      includeClients: event.isVisibleToClient,
      type: esPrimera
        ? NotificationType.NUEVO_ARCHIVO
        : NotificationType.NUEVA_VERSION,
      title: esPrimera ? 'Nuevo documento disponible' : 'Nueva version de un documento',
      body: `${event.containerName} (V${event.version})`,
      link: `/proyectos/${event.projectId}/archivos/${event.containerId}`,
    });
  }

  @OnEvent(EVENTS.RENDER_VERSION_PUBLISHED)
  async onRenderPublished(event: VersionPublishedEvent): Promise<void> {
    const esPrimera = event.version === 1;
    await this.notifyProject({
      projectId: event.projectId,
      exceptUserId: event.actorId,
      includeClients: event.isVisibleToClient,
      type: esPrimera
        ? NotificationType.NUEVO_RENDER
        : NotificationType.NUEVA_VERSION,
      title: esPrimera ? 'Nuevo render disponible' : 'Nueva version de un render',
      body: `${event.containerName} (V${event.version})`,
      link: `/proyectos/${event.projectId}/renders/${event.containerId}`,
    });
  }

  @OnEvent(EVENTS.COMMENT_CREATED)
  async onComment(event: CommentCreatedEvent): Promise<void> {
    const extracto =
      event.body.length > 120 ? `${event.body.slice(0, 117)}...` : event.body;

    await this.notifyProject({
      projectId: event.projectId,
      exceptUserId: event.authorId,
      // Un comentario interno no puede llegar al cliente ni como aviso:
      // el titulo del email ya filtraria informacion.
      includeClients: !event.isInternal,
      type: event.parentId
        ? NotificationType.RESPUESTA_COMENTARIO
        : NotificationType.NUEVO_COMENTARIO,
      title: event.parentId ? 'Respondieron a un comentario' : 'Nuevo comentario',
      body: extracto,
      link: `/proyectos/${event.projectId}/comentarios`,
    });
  }

  @OnEvent(EVENTS.APPROVAL_REQUESTED)
  async onApprovalRequested(event: ApprovalRequestedEvent): Promise<void> {
    await this.notifyProject({
      projectId: event.projectId,
      exceptUserId: event.requestedById,
      includeClients: true,
      type: NotificationType.APROBACION_PENDIENTE,
      title: 'Tienes una propuesta pendiente de aprobacion',
      body: event.targetLabel,
      link: `/proyectos/${event.projectId}/aprobaciones/${event.approvalId}`,
      sendEmail: true,
    });
  }

  @OnEvent(EVENTS.APPROVAL_DECIDED)
  async onApprovalDecided(event: ApprovalDecidedEvent): Promise<void> {
    const cambios = event.status === ApprovalStatus.CAMBIOS_SOLICITADOS;

    await this.notifyProject({
      projectId: event.projectId,
      exceptUserId: event.decidedById,
      includeClients: true,
      type: cambios
        ? NotificationType.CAMBIOS_SOLICITADOS
        : NotificationType.APROBACION_RESUELTA,
      title: cambios
        ? 'El cliente solicito cambios'
        : `Propuesta ${event.status.toLowerCase()}`,
      body: event.comment
        ? `${event.targetLabel} - ${event.comment}`
        : event.targetLabel,
      link: `/proyectos/${event.projectId}/aprobaciones/${event.approvalId}`,
      sendEmail: true,
    });
  }

  @OnEvent(EVENTS.MEMBER_ADDED)
  async onMemberAdded(event: MemberAddedEvent): Promise<void> {
    await this.notifications.create({
      userId: event.userId,
      type: NotificationType.MIEMBRO_AGREGADO,
      title: 'Te han dado acceso a un proyecto',
      body: event.projectName,
      link: `/proyectos/${event.projectId}`,
      projectId: event.projectId,
      sendEmail: true,
    });
  }

  /**
   * Notifica a los miembros del proyecto, saltandose a quien origino el
   * evento: nadie necesita que le avisen de lo que acaba de hacer.
   */
  private async notifyProject(params: {
    projectId: string;
    exceptUserId: string;
    includeClients: boolean;
    type: NotificationType;
    title: string;
    body: string;
    link: string;
    sendEmail?: boolean;
  }): Promise<void> {
    try {
      const members = await this.prisma.projectMember.findMany({
        where: {
          projectId: params.projectId,
          userId: { not: params.exceptUserId },
          user: {
            isActive: true,
            ...(params.includeClients ? {} : { role: { not: Role.CLIENT } }),
          },
        },
        select: { userId: true },
      });

      await Promise.all(
        members.map((m) =>
          this.notifications.create({
            userId: m.userId,
            type: params.type,
            title: params.title,
            body: params.body,
            link: params.link,
            projectId: params.projectId,
            sendEmail: params.sendEmail,
          }),
        ),
      );
    } catch (error) {
      // Que falle una notificacion no puede deshacer la operacion de
      // negocio que ya se completo: el render sigue publicado.
      this.logger.error(
        `No se pudieron crear las notificaciones del proyecto ${params.projectId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
