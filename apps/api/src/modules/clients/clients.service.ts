import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginated, type PaginatedResult } from '../../common/dto/pagination.dto';
import type {
  ClientQueryDto,
  CreateClientDto,
  UpdateClientDto,
} from './dto/client.dto';

/** Campos por los que tiene sentido ordenar; el resto se ignora. */
const CLIENT_SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ClientQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ClientWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { taxId: { contains: query.q, mode: 'insensitive' } },
              { contactEmail: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: query.resolveSort(CLIENT_SORT_FIELDS, 'name'),
        include: {
          // Contadores en el listado: evita que el frontend tenga que pedir
          // los proyectos de cada cliente solo para mostrar "3 proyectos".
          _count: { select: { projects: true, users: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, isActive: true },
          orderBy: { name: 'asc' },
        },
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            progress: true,
            updatedAt: true,
          },
          where: { archivedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('El cliente solicitado no existe');
    }

    return client;
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  /**
   * Desactiva el cliente en lugar de borrarlo.
   *
   * Borrarlo de verdad exigiria arrastrar sus proyectos, y con ellos los
   * renders aprobados y su historial: precisamente lo que el portal existe
   * para conservar. Client -> Project es onDelete Restrict justamente
   * para que un DELETE accidental no pueda llevarse todo por delante.
   */
  async deactivate(id: string) {
    await this.ensureExists(id);

    const activos = await this.prisma.project.count({
      where: { clientId: id, archivedAt: null },
    });

    if (activos > 0) {
      throw new BadRequestException(
        `Este cliente tiene ${activos} proyecto(s) sin archivar. ` +
          'Archivalos antes de desactivarlo.',
      );
    }

    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('El cliente solicitado no existe');
    }
  }
}
