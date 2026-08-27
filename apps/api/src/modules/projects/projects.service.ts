import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectRole, ProjectStatus, Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { EVENTS, type MemberAddedEvent } from '../../common/events/domain-events';
import { paginated, type PaginatedResult } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/decorators';
import type {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';

/** Campos por los que tiene sentido ordenar; el resto se ignora. */
const PROJECT_SORT_FIELDS = ['name', 'code', 'status', 'progress', 'createdAt', 'updatedAt', 'startDate', 'targetDate'] as const;

const PROJECT_CODE_PREFIX = 'PRY';

/** Estados que cuentan como proyecto "activo" en los contadores. */
const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.POR_INICIAR,
  ProjectStatus.EN_DISENO,
  ProjectStatus.ESPERANDO_CLIENTE,
  ProjectStatus.APROBADO,
  ProjectStatus.EN_INSTALACION,
];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ------------------------- LECTURA -------------------------

  /**
   * Listado con alcance segun quien pregunta.
   *
   * El filtro de visibilidad se aplica AQUI, en el where, y no filtrando
   * despues de leer: un cliente nunca llega a cargar en memoria proyectos
   * que no le pertenecen.
   */
  async findAll(
    query: ProjectQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProjectWhereInput = {
      ...this.visibilityScope(user),
      ...(query.status ? { status: query.status } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.includeArchived ? {} : { archivedAt: null }),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { code: { contains: query.q, mode: 'insensitive' } },
              { location: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: query.resolveSort(PROJECT_SORT_FIELDS, 'updatedAt'),
        include: {
          client: { select: { id: true, name: true } },
          _count: {
            select: { members: true, renders: true, files: true, comments: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  /**
   * El ProjectAccessGuard ya verifico el acceso antes de llegar aqui,
   * asi que este metodo solo se ocupa de armar la respuesta.
   */
  async findOne(id: string, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, contactEmail: true } },
        createdBy: { select: { id: true, name: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { renders: true, files: true, comments: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('El proyecto solicitado no existe');
    }

    // Un cliente no tiene por que ver el equipo interno completo.
    if (user.role === Role.CLIENT) {
      return {
        ...project,
        members: project.members.filter(
          (m) => m.user.role === Role.CLIENT || m.projectRole === ProjectRole.MANAGER,
        ),
      };
    }

    return project;
  }

  /** Contadores del dashboard (secciones 4 y 24 del documento). */
  async dashboard(user: AuthUser) {
    const scope = this.visibilityScope(user);
    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Un contador por estado en lugar de groupBy: son 7 valores conocidos,
    // van en la misma transaccion y el resultado es de tipo exacto.
    const estados = Object.values(ProjectStatus);

    const [
      total,
      activos,
      ...resto
    ] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { ...scope, archivedAt: null } }),
      this.prisma.project.count({
        where: { ...scope, archivedAt: null, status: { in: ACTIVE_STATUSES } },
      }),
      ...estados.map((status) =>
        this.prisma.project.count({
          where: { ...scope, archivedAt: null, status },
        }),
      ),
      this.prisma.fileVersion.count({
        where: { createdAt: { gte: desde }, file: { project: scope } },
      }),
      this.prisma.approval.count({
        where: {
          project: scope,
          status: { in: ['PENDIENTE', 'EN_REVISION'] },
        },
      }),
      this.prisma.comment.count({
        where: {
          project: scope,
          createdAt: { gte: desde },
          deletedAt: null,
          authorId: { not: user.id },
          // Un cliente no debe ver comentarios internos ni en el contador.
          ...(user.role === Role.CLIENT ? { isInternal: false } : {}),
        },
      }),
    ]);

    // El orden de `resto` es el de la transaccion: primero un contador por
    // cada estado, y despues los tres de novedades.
    const conteosPorEstado = resto.slice(0, estados.length);
    const [archivosNuevos, aprobacionesPendientes, comentariosNuevos] =
      resto.slice(estados.length);

    return {
      totales: { proyectos: total, activos },
      porEstado: Object.fromEntries(
        estados.map((status, i) => [status, conteosPorEstado[i]]),
      ),
      novedades: {
        archivosNuevos,
        aprobacionesPendientes,
        comentariosNuevos,
        desde: desde.toISOString(),
      },
    };
  }

  // ------------------------ ESCRITURA ------------------------

  async create(dto: CreateProjectDto, user: AuthUser) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true, isActive: true },
    });

    if (!client) {
      throw new BadRequestException('El cliente indicado no existe');
    }
    if (!client.isActive) {
      throw new BadRequestException(
        'No se pueden crear proyectos para un cliente desactivado',
      );
    }

    const project = await this.createWithGeneratedCode(dto, user.id);

    // Quien crea el proyecto queda como OWNER: si no, un PM podria crear
    // un proyecto y quedarse sin acceso a el.
    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        projectRole: ProjectRole.OWNER,
        addedById: user.id,
      },
    });

    return this.prisma.project.findUnique({
      where: { id: project.id },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.ensureExists(id);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.targetDate ? { targetDate: new Date(dto.targetDate) } : {}),
        ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
      },
    });
  }

  async updateStatus(id: string, status: ProjectStatus) {
    await this.ensureExists(id);

    return this.prisma.project.update({
      where: { id },
      data: {
        status,
        // Cerrar el proyecto fija la fecha de fin y el avance al 100%
        // automaticamente: son datos que si no, se olvidan.
        ...(status === ProjectStatus.FINALIZADO
          ? { endDate: new Date(), progress: 100 }
          : {}),
      },
    });
  }

  async updateProgress(id: string, progress: number) {
    await this.ensureExists(id);
    return this.prisma.project.update({ where: { id }, data: { progress } });
  }

  /** Archivar en vez de borrar: el historial del proyecto se conserva. */
  async archive(id: string) {
    await this.ensureExists(id);
    return this.prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  async unarchive(id: string) {
    await this.ensureExists(id);
    return this.prisma.project.update({
      where: { id },
      data: { archivedAt: null },
    });
  }

  // ------------------------- MIEMBROS -------------------------

  async listMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(projectId: string, dto: AddProjectMemberDto, actor: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, name: true },
    });
    if (!project) {
      throw new NotFoundException('El proyecto solicitado no existe');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, role: true, clientId: true, isActive: true },
    });
    if (!user) {
      throw new BadRequestException('El usuario indicado no existe');
    }
    if (!user.isActive) {
      throw new BadRequestException('No se puede anadir un usuario desactivado');
    }

    // Un usuario CLIENT solo puede entrar en proyectos de SU empresa.
    // Sin esta comprobacion, anadir al miembro equivocado abriria el
    // proyecto de un cliente a otro distinto.
    if (user.role === Role.CLIENT && user.clientId !== project.clientId) {
      throw new BadRequestException(
        'Este usuario pertenece a otro cliente y no puede acceder a este proyecto',
      );
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('El usuario ya es miembro de este proyecto');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        projectRole: dto.projectRole ?? ProjectRole.VIEWER,
        addedById: actor.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    this.events.emit(EVENTS.MEMBER_ADDED, {
      projectId,
      projectName: project.name,
      userId: dto.userId,
      addedById: actor.id,
    } satisfies MemberAddedEvent);

    return member;
  }

  async removeMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true, projectRole: true },
    });

    if (!member) {
      throw new NotFoundException('Ese usuario no es miembro del proyecto');
    }

    // Un proyecto sin OWNER queda huerfano: nadie podria gestionarlo.
    if (member.projectRole === ProjectRole.OWNER) {
      const owners = await this.prisma.projectMember.count({
        where: { projectId, projectRole: ProjectRole.OWNER },
      });
      if (owners <= 1) {
        throw new BadRequestException(
          'No se puede quitar al unico responsable del proyecto. Asigna otro primero.',
        );
      }
    }

    await this.prisma.projectMember.delete({ where: { id: member.id } });
  }

  // ------------------------- INTERNOS -------------------------

  /**
   * Filtro de visibilidad por rol.
   * ADMIN y PROJECT_MANAGER ven todo; el resto, solo donde son miembros.
   */
  private visibilityScope(user: AuthUser): Prisma.ProjectWhereInput {
    if (user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER) {
      return {};
    }
    return { members: { some: { userId: user.id } } };
  }

  /**
   * Genera el codigo legible (PRY-2026-001).
   *
   * Dos peticiones simultaneas pueden calcular el mismo numero, asi que
   * en lugar de bloquear la tabla se reintenta ante la violacion de
   * unicidad: es mas simple y el caso es poco frecuente.
   */
  private async createWithGeneratedCode(
    dto: CreateProjectDto,
    createdById: string,
    intento = 0,
  ): Promise<{ id: string }> {
    const year = new Date().getFullYear();
    const prefix = `${PROJECT_CODE_PREFIX}-${year}-`;

    const last = await this.prisma.project.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const nextNumber = last
      ? Number.parseInt(last.code.slice(prefix.length), 10) + 1
      : 1;

    const code = `${prefix}${String(nextNumber + intento).padStart(3, '0')}`;

    try {
      return await this.prisma.project.create({
        data: {
          clientId: dto.clientId,
          code,
          name: dto.name,
          description: dto.description,
          location: dto.location,
          status: dto.status ?? ProjectStatus.POR_INICIAR,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
          createdById,
        },
        select: { id: true },
      });
    } catch (error) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';

      if (isDuplicate && intento < 5) {
        return this.createWithGeneratedCode(dto, createdById, intento + 1);
      }
      throw error;
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('El proyecto solicitado no existe');
    }
  }
}
