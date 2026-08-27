import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Role, UploadStatus } from '@prisma/client';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadValidatorService } from '../storage/upload-validator.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { paginated, type PaginatedResult } from '../../common/dto/pagination.dto';
import {
  EVENTS,
  type VersionPublishedEvent,
} from '../../common/events/domain-events';
import type { AuthUser } from '../../common/decorators';
import type {
  ConfirmUploadDto,
  CreateRenderDto,
  RenderQueryDto,
  UploadIntentDto,
} from '../files/dto/file.dto';

/** Campos por los que tiene sentido ordenar; el resto se ignora. */
const RENDER_SORT_FIELDS = ['title', 'area', 'type', 'createdAt', 'updatedAt'] as const;

@Injectable()
export class RendersService {
  private readonly logger = new Logger(RendersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly validator: UploadValidatorService,
    private readonly access: ProjectAccessService,
    private readonly events: EventEmitter2,
  ) {}

  // ------------------------- LECTURA -------------------------

  async findAll(
    projectId: string,
    query: RenderQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.RenderWhereInput = {
      projectId,
      deletedAt: null,
      ...(user.role === Role.CLIENT ? { isVisibleToClient: true } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { area: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.render.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: query.resolveSort(RENDER_SORT_FIELDS, 'updatedAt'),
        include: {
          createdBy: { select: { id: true, name: true } },
          currentVersion: {
            select: {
              id: true,
              version: true,
              status: true,
              thumbnailKey: true,
              width: true,
              height: true,
              createdAt: true,
            },
          },
          _count: { select: { versions: true } },
        },
      }),
      this.prisma.render.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  async findOne(renderId: string, user: AuthUser) {
    const render = await this.prisma.render.findFirst({
      where: { id: renderId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        currentVersion: true,
        versions: {
          where: { uploadStatus: UploadStatus.COMPLETED },
          orderBy: { version: 'desc' },
          include: { uploadedBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!render) {
      throw new NotFoundException('El render solicitado no existe');
    }
    // El guard no cubre esta ruta: el id del proyecto no viaja en ella.
    await this.access.assertMember(render.projectId, user);
    this.assertVisible(render.isVisibleToClient, user);

    return render;
  }

  async listVersions(renderId: string, user: AuthUser) {
    const render = await this.prisma.render.findFirst({
      where: { id: renderId, deletedAt: null },
      select: { projectId: true, isVisibleToClient: true },
    });

    if (!render) {
      throw new NotFoundException('El render solicitado no existe');
    }
    await this.access.assertMember(render.projectId, user);
    this.assertVisible(render.isVisibleToClient, user);

    return this.prisma.renderVersion.findMany({
      where: { renderId, uploadStatus: UploadStatus.COMPLETED },
      orderBy: { version: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  async getViewUrl(renderId: string, versionId: string | undefined, user: AuthUser) {
    const render = await this.prisma.render.findFirst({
      where: { id: renderId, deletedAt: null },
      include: { currentVersion: true },
    });

    if (!render) {
      throw new NotFoundException('El render solicitado no existe');
    }
    await this.access.assertMember(render.projectId, user);
    this.assertVisible(render.isVisibleToClient, user);

    const version = versionId
      ? await this.prisma.renderVersion.findFirst({
          where: { id: versionId, renderId, uploadStatus: UploadStatus.COMPLETED },
        })
      : render.currentVersion;

    if (!version) {
      throw new NotFoundException('La version solicitada no existe');
    }

    const [url, thumbnailUrl] = await Promise.all([
      this.storage.createDownloadUrl(version.storageKey),
      version.thumbnailKey
        ? this.storage.createDownloadUrl(version.thumbnailKey)
        : Promise.resolve(null),
    ]);

    return {
      url,
      thumbnailUrl,
      version: version.version,
      status: version.status,
      width: version.width,
      height: version.height,
      sizeBytes: version.sizeBytes.toString(),
      expiresIn: 300,
    };
  }

  // --------------------- CICLO DE SUBIDA ---------------------

  async createRender(projectId: string, dto: CreateRenderDto, user: AuthUser) {
    this.validator.validate(dto);

    const render = await this.prisma.render.create({
      data: {
        projectId,
        title: dto.title,
        area: dto.area,
        type: dto.type ?? 'INTERIOR',
        description: dto.description,
        isVisibleToClient: dto.isVisibleToClient ?? true,
        createdById: user.id,
      },
    });

    const intent = await this.createVersionIntent(render.id, dto, user, projectId);

    return { render, upload: intent };
  }

  async createUploadIntent(renderId: string, dto: UploadIntentDto, user: AuthUser) {
    this.validator.validate(dto);

    const render = await this.prisma.render.findFirst({
      where: { id: renderId, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!render) {
      throw new NotFoundException('El render solicitado no existe');
    }
    await this.access.assertMember(render.projectId, user);

    return this.createVersionIntent(renderId, dto, user, render.projectId);
  }

  async confirmUpload(
    renderId: string,
    versionId: string,
    dto: ConfirmUploadDto,
    user: AuthUser,
  ) {
    const version = await this.prisma.renderVersion.findFirst({
      where: { id: versionId, renderId },
      include: {
        render: {
          select: { id: true, title: true, projectId: true, isVisibleToClient: true },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('La version solicitada no existe');
    }
    await this.access.assertMember(version.render.projectId, user);

    if (version.uploadStatus === UploadStatus.COMPLETED) {
      throw new BadRequestException('Esta version ya fue confirmada');
    }

    const meta = await this.storage.getObjectMetadata(version.storageKey);

    if (!meta) {
      await this.prisma.renderVersion.update({
        where: { id: versionId },
        data: { uploadStatus: UploadStatus.FAILED },
      });
      throw new BadRequestException(
        'No se encontro el render en el almacenamiento. La subida no se completo.',
      );
    }

    this.validator.validateSize(meta.sizeBytes);

    const updated = await this.prisma.renderVersion.update({
      where: { id: versionId },
      data: {
        uploadStatus: UploadStatus.COMPLETED,
        sizeBytes: BigInt(meta.sizeBytes),
        mimeType: meta.mimeType,
      },
    });

    await this.prisma.render.update({
      where: { id: renderId },
      data: { currentVersionId: versionId },
    });

    // La miniatura se genera en segundo plano: hacer esperar a quien sube
    // mientras se procesa una imagen de 40 MB no aporta nada.
    if (this.validator.isImage(meta.mimeType)) {
      void this.generateThumbnail(versionId, version.storageKey);
    }

    this.events.emit(EVENTS.RENDER_VERSION_PUBLISHED, {
      projectId: version.render.projectId,
      containerId: renderId,
      containerName: version.render.title,
      versionId,
      version: version.version,
      actorId: user.id,
      isVisibleToClient: version.render.isVisibleToClient,
    } satisfies VersionPublishedEvent);

    return updated;
  }

  async softDelete(renderId: string, user: AuthUser) {
    const render = await this.prisma.render.findFirst({
      where: { id: renderId, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!render) {
      throw new NotFoundException('El render solicitado no existe');
    }
    await this.access.assertMember(render.projectId, user);

    return this.prisma.render.update({
      where: { id: renderId },
      data: { deletedAt: new Date() },
    });
  }

  // ------------------------- INTERNOS -------------------------

  private async createVersionIntent(
    renderId: string,
    dto: UploadIntentDto,
    user: AuthUser,
    projectId: string,
  ) {
    const last = await this.prisma.renderVersion.findFirst({
      where: { renderId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (last?.version ?? 0) + 1;

    const storageKey = this.storage.buildVersionKey({
      projectId,
      kind: 'renders',
      containerId: renderId,
      version,
      filename: dto.filename,
    });

    const row = await this.prisma.renderVersion.create({
      data: {
        renderId,
        version,
        storageKey,
        originalName: dto.filename,
        mimeType: dto.mimeType,
        sizeBytes: BigInt(dto.sizeBytes),
        notes: dto.notes,
        uploadedById: user.id,
        uploadStatus: UploadStatus.PENDING,
      },
    });

    const presigned = await this.storage.createUploadUrl(storageKey, dto.mimeType);

    return {
      versionId: row.id,
      version,
      uploadUrl: presigned.uploadUrl,
      storageKey,
      expiresIn: presigned.expiresIn,
      requiredHeaders: { 'Content-Type': dto.mimeType },
    };
  }

  /**
   * Genera la miniatura y guarda las dimensiones reales.
   *
   * Corre fuera del ciclo de la peticion: si falla, la version publicada
   * sigue siendo valida y solo se pierde la vista previa. Por eso captura
   * el error en lugar de propagarlo.
   */
  private async generateThumbnail(
    versionId: string,
    storageKey: string,
  ): Promise<void> {
    try {
      const original = await this.storage.getObjectBuffer(storageKey);
      if (!original) return;

      const image = sharp(original);
      const metadata = await image.metadata();

      const thumbnail = await image
        .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailKey = this.storage.buildThumbnailKey(storageKey);
      await this.storage.putObject(thumbnailKey, thumbnail, 'image/webp');

      await this.prisma.renderVersion.update({
        where: { id: versionId },
        data: {
          thumbnailKey,
          width: metadata.width ?? null,
          height: metadata.height ?? null,
        },
      });

      this.logger.log(`Miniatura generada para la version ${versionId}`);
    } catch (error) {
      this.logger.warn(
        `No se pudo generar la miniatura de ${versionId}: ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  private assertVisible(isVisibleToClient: boolean, user: AuthUser): void {
    if (user.role === Role.CLIENT && !isVisibleToClient) {
      throw new NotFoundException('El render solicitado no existe');
    }
  }
}
