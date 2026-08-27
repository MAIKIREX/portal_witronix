import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Role, TargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { paginated, type PaginatedResult } from '../../common/dto/pagination.dto';
import {
  EVENTS,
  type CommentCreatedEvent,
} from '../../common/events/domain-events';
import type { AuthUser } from '../../common/decorators';
import type {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(
    projectId: string,
    query: CommentQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CommentWhereInput = {
      projectId,
      deletedAt: null,
      // Solo hilos raiz: las respuestas viajan anidadas.
      parentId: null,
      // Un comentario interno del equipo no debe llegarle nunca al cliente.
      ...(user.role === Role.CLIENT ? { isInternal: false } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(query.unresolved ? { resolvedAt: null } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        include: {
          author: { select: { id: true, name: true, role: true } },
          resolvedBy: { select: { id: true, name: true } },
          replies: {
            where: {
              deletedAt: null,
              ...(user.role === Role.CLIENT ? { isInternal: false } : {}),
            },
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, name: true, role: true } } },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  async create(projectId: string, dto: CreateCommentDto, user: AuthUser) {
    await this.access.assertMember(projectId, user);

    // El objetivo tiene que existir Y pertenecer a este proyecto: sin esta
    // comprobacion se podria anclar un comentario al render de otro cliente.
    await this.assertTargetBelongsToProject(dto.targetType, dto.targetId, projectId);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, projectId, deletedAt: null },
        select: { id: true, parentId: true, isInternal: true },
      });
      if (!parent) {
        throw new BadRequestException('El comentario al que respondes no existe');
      }
      // Hilos de un solo nivel: responder a una respuesta cuelga del mismo hilo.
      if (parent.parentId) {
        throw new BadRequestException(
          'No se puede responder a una respuesta. Responde al comentario original.',
        );
      }
      // Responder en un hilo interno no puede hacerlo visible al cliente.
      if (parent.isInternal && !dto.isInternal) {
        throw new BadRequestException(
          'Las respuestas dentro de un hilo interno deben ser internas',
        );
      }
    }

    // Solo el equipo puede marcar algo como interno.
    const isInternal = user.role === Role.CLIENT ? false : (dto.isInternal ?? false);

    const comment = await this.prisma.comment.create({
      data: {
        projectId,
        authorId: user.id,
        body: dto.body,
        parentId: dto.parentId ?? null,
        targetType: dto.targetType,
        targetId: dto.targetId,
        anchorX: dto.anchorX ?? null,
        anchorY: dto.anchorY ?? null,
        isInternal,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    this.events.emit(EVENTS.COMMENT_CREATED, {
      projectId,
      commentId: comment.id,
      authorId: user.id,
      body: comment.body,
      targetType: comment.targetType,
      targetId: comment.targetId,
      parentId: comment.parentId,
      isInternal: comment.isInternal,
    } satisfies CommentCreatedEvent);

    return comment;
  }

  async update(commentId: string, dto: UpdateCommentDto, user: AuthUser) {
    const comment = await this.load(commentId, user);

    // Editar el comentario de otro reescribiria lo que dijo. Ni el admin.
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('Solo puedes editar tus propios comentarios');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body, editedAt: new Date() },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
  }

  async resolve(commentId: string, user: AuthUser) {
    const comment = await this.load(commentId, user);

    if (comment.resolvedAt) {
      throw new BadRequestException('Este comentario ya esta resuelto');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolvedAt: new Date(), resolvedById: user.id },
      include: { resolvedBy: { select: { id: true, name: true } } },
    });
  }

  async reopen(commentId: string, user: AuthUser) {
    await this.load(commentId, user);
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolvedAt: null, resolvedById: null },
    });
  }

  async softDelete(commentId: string, user: AuthUser) {
    const comment = await this.load(commentId, user);

    const puede = comment.authorId === user.id || user.role === Role.ADMIN;
    if (!puede) {
      throw new ForbiddenException('Solo puedes eliminar tus propios comentarios');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }

  // ------------------------- INTERNOS -------------------------

  private async load(commentId: string, user: AuthUser) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('El comentario solicitado no existe');
    }
    await this.access.assertMember(comment.projectId, user);

    if (user.role === Role.CLIENT && comment.isInternal) {
      throw new NotFoundException('El comentario solicitado no existe');
    }

    return comment;
  }

  /**
   * Verifica que el objetivo del comentario existe y pertenece al proyecto.
   * Sin esto, targetId seria un campo libre y se podria anclar un
   * comentario sobre un recurso ajeno.
   */
  private async assertTargetBelongsToProject(
    targetType: TargetType,
    targetId: string,
    projectId: string,
  ): Promise<void> {
    let pertenece = false;

    switch (targetType) {
      case TargetType.PROJECT:
        pertenece = targetId === projectId;
        break;
      case TargetType.RENDER:
        pertenece =
          (await this.prisma.render.count({
            where: { id: targetId, projectId, deletedAt: null },
          })) > 0;
        break;
      case TargetType.RENDER_VERSION:
        pertenece =
          (await this.prisma.renderVersion.count({
            where: { id: targetId, render: { projectId, deletedAt: null } },
          })) > 0;
        break;
      case TargetType.PROJECT_FILE:
        pertenece =
          (await this.prisma.projectFile.count({
            where: { id: targetId, projectId, deletedAt: null },
          })) > 0;
        break;
      case TargetType.FILE_VERSION:
        pertenece =
          (await this.prisma.fileVersion.count({
            where: { id: targetId, file: { projectId, deletedAt: null } },
          })) > 0;
        break;
      case TargetType.COMMENT:
        pertenece =
          (await this.prisma.comment.count({
            where: { id: targetId, projectId, deletedAt: null },
          })) > 0;
        break;
    }

    if (!pertenece) {
      throw new BadRequestException(
        'El elemento sobre el que comentas no existe en este proyecto',
      );
    }
  }
}
