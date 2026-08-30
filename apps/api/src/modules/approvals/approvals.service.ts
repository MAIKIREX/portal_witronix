import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApprovalStatus, Prisma, TargetType } from '@prisma/client';
import { APPROVAL_TRANSITIONS, canTransition } from '@witronix/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { StorageService } from '../storage/storage.service';
import { paginated, type PaginatedResult } from '../../common/dto/pagination.dto';
import {
  EVENTS,
  type ApprovalDecidedEvent,
  type ApprovalRequestedEvent,
} from '../../common/events/domain-events';
import type { AuthUser } from '../../common/decorators';
import type {
  ApprovalQueryDto,
  CreateApprovalDto,
  DecideApprovalDto,
} from './dto/approval.dto';

/** Campos por los que tiene sentido ordenar; el resto se ignora. */
const APPROVAL_SORT_FIELDS = ['status', 'createdAt', 'updatedAt', 'requestedAt', 'decidedAt'] as const;

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly access: ProjectAccessService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(
    projectId: string,
    query: ApprovalQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    await this.access.assertMember(projectId, user);

    const where: Prisma.ApprovalWhereInput = {
      projectId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.pending
        ? { status: { in: [ApprovalStatus.PENDIENTE, ApprovalStatus.EN_REVISION] } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.approval.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: query.resolveSort(APPROVAL_SORT_FIELDS, 'createdAt'),
        include: {
          requestedBy: { select: { id: true, name: true } },
          decidedBy: { select: { id: true, name: true } },
          _count: { select: { events: true } },
        },
      }),
      this.prisma.approval.count({ where }),
    ]);

    const itemsWithTargets = await Promise.all(
      data.map(async (approval) => {
        const target = await this.resolveTargetSummary(
          approval.targetType,
          approval.targetId,
          approval.projectId,
          true,
        ).catch(() => null);

        return {
          ...approval,
          target,
          targetLabel: target?.label ?? undefined,
        };
      }),
    );

    return paginated(itemsWithTargets, total, query);
  }

  async findOne(approvalId: string, user: AuthUser) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        requestedBy: { select: { id: true, name: true } },
        decidedBy: { select: { id: true, name: true } },
        events: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('La aprobacion solicitada no existe');
    }
    await this.access.assertMember(approval.projectId, user);

    const target = await this.resolveTargetSummary(
      approval.targetType,
      approval.targetId,
      approval.projectId,
      true,
    ).catch(() => null);

    return {
      ...approval,
      target,
      targetLabel: target?.label ?? undefined,
      // El frontend usa esto para saber que botones ofrecer, en vez de
      // reimplementar las reglas de transicion por su cuenta.
      transicionesPosibles: APPROVAL_TRANSITIONS[approval.status],
    };
  }

  /** Historial completo: quien hizo que y cuando. Seccion 7 del documento. */
  async listEvents(approvalId: string, user: AuthUser) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      select: { projectId: true },
    });

    if (!approval) {
      throw new NotFoundException('La aprobacion solicitada no existe');
    }
    await this.access.assertMember(approval.projectId, user);

    return this.prisma.approvalEvent.findMany({
      where: { approvalId },
      orderBy: { createdAt: 'asc' },
      include: { actor: { select: { id: true, name: true, role: true } } },
    });
  }

  async create(projectId: string, dto: CreateApprovalDto, user: AuthUser) {
    await this.access.assertMember(projectId, user);

    const label = await this.resolveTargetLabel(
      dto.targetType,
      dto.targetId,
      projectId,
    );

    // Una sola aprobacion viva por objetivo: dos abiertas a la vez sobre
    // el mismo render harian imposible saber cual es la decision valida.
    const abierta = await this.prisma.approval.findFirst({
      where: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: {
          notIn: [ApprovalStatus.APROBADO, ApprovalStatus.RECHAZADO],
        },
      },
      select: { id: true },
    });

    if (abierta) {
      throw new ConflictException(
        'Ya hay una aprobacion abierta para este elemento',
      );
    }

    const approval = await this.prisma.$transaction(async (tx) => {
      const created = await tx.approval.create({
        data: {
          projectId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          status: ApprovalStatus.PENDIENTE,
          requestedById: user.id,
          comment: dto.comment,
        },
      });

      await tx.approvalEvent.create({
        data: {
          approvalId: created.id,
          fromStatus: null,
          toStatus: ApprovalStatus.PENDIENTE,
          actorId: user.id,
          comment: dto.comment,
        },
      });

      return created;
    });

    this.events.emit(EVENTS.APPROVAL_REQUESTED, {
      projectId,
      approvalId: approval.id,
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetLabel: label,
      requestedById: user.id,
    } satisfies ApprovalRequestedEvent);

    return approval;
  }

  /**
   * Aplica una transicion de estado.
   *
   * Las transiciones validas viven en @witronix/shared, compartidas con el
   * frontend. Se validan aqui de todas formas: el frontend decide que
   * botones muestra, pero no es quien autoriza nada.
   */
  async transition(
    approvalId: string,
    toStatus: ApprovalStatus,
    dto: DecideApprovalDto,
    user: AuthUser,
  ) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new NotFoundException('La aprobacion solicitada no existe');
    }
    await this.access.assertMember(approval.projectId, user);

    if (!canTransition(approval.status, toStatus)) {
      const posibles = APPROVAL_TRANSITIONS[approval.status];
      throw new BadRequestException(
        posibles.length === 0
          ? `Esta aprobacion ya esta cerrada (${approval.status}) y no admite cambios. ` +
            'Si hace falta otra decision, crea una aprobacion sobre la nueva version.'
          : `No se puede pasar de ${approval.status} a ${toStatus}. ` +
            `Transiciones posibles: ${posibles.join(', ')}`,
      );
    }

    const esDecisionFinal =
      toStatus === ApprovalStatus.APROBADO || toStatus === ApprovalStatus.RECHAZADO;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: toStatus,
          comment: dto.comment ?? approval.comment,
          ...(esDecisionFinal
            ? { decidedById: user.id, decidedAt: new Date() }
            : {}),
        },
      });

      // El evento se escribe SIEMPRE, en la misma transaccion: si el
      // historial pudiera quedar incompleto, no serviria como trazabilidad.
      await tx.approvalEvent.create({
        data: {
          approvalId,
          fromStatus: approval.status,
          toStatus,
          actorId: user.id,
          comment: dto.comment,
        },
      });

      // Reflejar la decision en la version del render, para que el listado
      // muestre el estado sin tener que cruzar con las aprobaciones.
      if (approval.targetType === TargetType.RENDER_VERSION) {
        await tx.renderVersion.update({
          where: { id: approval.targetId },
          data: { status: toStatus },
        });
      }

      return result;
    });

    const label = await this.resolveTargetLabel(
      approval.targetType,
      approval.targetId,
      approval.projectId,
    ).catch(() => 'elemento');

    this.events.emit(EVENTS.APPROVAL_DECIDED, {
      projectId: approval.projectId,
      approvalId,
      targetLabel: label,
      status: toStatus,
      decidedById: user.id,
      comment: dto.comment ?? null,
    } satisfies ApprovalDecidedEvent);

    return updated;
  }

  // ------------------------- INTERNOS -------------------------

  /** Resumen completo del objetivo con URLs y metadatos para UI rica */
  async resolveTargetSummary(
    targetType: TargetType,
    targetId: string,
    projectId: string,
    generateUrls = true,
  ) {
    switch (targetType) {
      case TargetType.RENDER_VERSION: {
        const v = await this.prisma.renderVersion.findFirst({
          where: { id: targetId, render: { projectId, deletedAt: null } },
          include: {
            render: {
              select: { id: true, title: true, area: true, type: true },
            },
          },
        });
        if (!v) return null;

        let thumbnailUrl: string | null = null;
        let viewUrl: string | null = null;
        if (generateUrls) {
          if (v.thumbnailKey) {
            thumbnailUrl = await this.storage
              .createDownloadUrl(v.thumbnailKey)
              .catch(() => null);
          } else if (v.storageKey && v.mimeType?.startsWith('image/')) {
            thumbnailUrl = await this.storage
              .createDownloadUrl(v.storageKey)
              .catch(() => null);
          }
          if (v.storageKey) {
            viewUrl = await this.storage
              .createDownloadUrl(v.storageKey)
              .catch(() => null);
          }
        }

        return {
          id: v.id,
          targetType,
          title: v.render.title,
          version: v.version,
          label: `${v.render.title} (V${v.version})`,
          area: v.render.area,
          renderType: v.render.type,
          renderId: v.render.id,
          mimeType: v.mimeType,
          originalName: v.originalName,
          thumbnailUrl,
          viewUrl,
        };
      }
      case TargetType.FILE_VERSION: {
        const v = await this.prisma.fileVersion.findFirst({
          where: { id: targetId, file: { projectId, deletedAt: null } },
          include: {
            file: {
              select: { id: true, name: true, category: true },
            },
          },
        });
        if (!v) return null;

        let viewUrl: string | null = null;
        let downloadUrl: string | null = null;
        if (generateUrls && v.storageKey) {
          viewUrl = await this.storage
            .createDownloadUrl(v.storageKey)
            .catch(() => null);
          downloadUrl = await this.storage
            .createDownloadUrl(v.storageKey, v.originalName)
            .catch(() => null);
        }

        return {
          id: v.id,
          targetType,
          title: v.file.name,
          version: v.version,
          label: `${v.file.name} (V${v.version})`,
          category: v.file.category,
          fileId: v.file.id,
          mimeType: v.mimeType,
          originalName: v.originalName,
          sizeBytes: v.sizeBytes.toString(),
          viewUrl,
          downloadUrl,
        };
      }
      case TargetType.RENDER: {
        const r = await this.prisma.render.findFirst({
          where: { id: targetId, projectId, deletedAt: null },
          select: { id: true, title: true, area: true, type: true },
        });
        if (!r) return null;
        return {
          id: r.id,
          targetType,
          title: r.title,
          label: r.title,
          area: r.area,
          renderType: r.type,
          renderId: r.id,
        };
      }
      case TargetType.PROJECT_FILE: {
        const f = await this.prisma.projectFile.findFirst({
          where: { id: targetId, projectId, deletedAt: null },
          select: { id: true, name: true, category: true },
        });
        if (!f) return null;
        return {
          id: f.id,
          targetType,
          title: f.name,
          label: f.name,
          category: f.category,
          fileId: f.id,
        };
      }
      default:
        return null;
    }
  }

  /** Nombre legible del objetivo, y de paso valida que sea del proyecto. */
  private async resolveTargetLabel(
    targetType: TargetType,
    targetId: string,
    projectId: string,
  ): Promise<string> {
    const summary = await this.resolveTargetSummary(
      targetType,
      targetId,
      projectId,
      false,
    );
    if (!summary) {
      throw new BadRequestException(
        'El elemento a aprobar no existe en este proyecto',
      );
    }
    return summary.label;
  }
}
