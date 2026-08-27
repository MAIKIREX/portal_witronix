import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, type TargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { paginated, type PaginatedResult } from '../../common/dto/pagination.dto';
import type { NotificationQueryDto } from './dto/notification.dto';
import type { AuthUser } from '../../common/decorators';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  projectId?: string;
  targetType?: TargetType;
  targetId?: string;
  sendEmail?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(params: CreateNotificationParams) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
        projectId: params.projectId,
        targetType: params.targetType,
        targetId: params.targetId,
      },
    });

    // El email solo para lo que de verdad requiere accion: si cada
    // comentario generase un correo, se acabarian filtrando todos.
    if (params.sendEmail) {
      void this.sendEmail(notification.id, params);
    }

    return notification;
  }

  async findAll(
    query: NotificationQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    const where = {
      userId: user.id,
      ...(query.unread ? { readAt: null } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  async unreadCount(user: AuthUser): Promise<{ unread: number }> {
    const unread = await this.prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return { unread };
  }

  async markRead(notificationId: string, user: AuthUser) {
    // El where incluye el userId: nadie puede marcar como leida la
    // notificacion de otra persona aunque conozca su id.
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('La notificacion solicitada no existe');
    }

    return { ok: true };
  }

  async markAllRead(user: AuthUser): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  private async sendEmail(
    notificationId: string,
    params: CreateNotificationParams,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, name: true, isActive: true },
      });

      if (!user?.isActive) return;

      await this.mail.sendNotification({
        to: user.email,
        name: user.name,
        title: params.title,
        body: params.body ?? '',
        link: params.link,
      });

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { emailSentAt: new Date() },
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar el email de la notificacion ${notificationId}: ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
