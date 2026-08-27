import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, TargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import {
  paginated,
  type PaginatedResult,
  type PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/decorators';

interface RecordParams {
  projectId?: string;
  actorId?: string;
  action: string;
  targetType?: TargetType;
  targetId?: string;
  targetLabel?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Linea de tiempo del proyecto (seccion 20 del documento).
 * Append-only: una entrada nunca se edita ni se borra.
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async record(params: RecordParams): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          projectId: params.projectId,
          actorId: params.actorId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          // Se guarda el nombre legible EN ESTE MOMENTO: si el render se
          // renombra manana, el historial sigue contando lo que paso.
          targetLabel: params.targetLabel,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      // El registro de actividad no puede tumbar la operacion que registra.
      this.logger.error(
        `No se pudo registrar la actividad "${params.action}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async findByProject(
    projectId: string,
    query: PaginationQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    await this.access.assertMember(projectId, user);

    const where = { projectId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, name: true, role: true } } },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return paginated(data, total, query);
  }
}
