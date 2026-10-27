import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Role, UploadStatus } from '@prisma/client';
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
  CreateProjectFileDto,
  FileQueryDto,
  UploadIntentDto,
} from './dto/file.dto';

/** Campos por los que tiene sentido ordenar; el resto se ignora. */
const FILE_SORT_FIELDS = ['name', 'category', 'createdAt', 'updatedAt'] as const;

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

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
    query: FileQueryDto,
    user: AuthUser,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProjectFileWhereInput = {
      projectId,
      deletedAt: null,
      // Un borrador interno no debe aparecerle al cliente ni en el listado.
      ...(user.role === Role.CLIENT ? { isVisibleToClient: true } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.projectFile.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: query.resolveSort(FILE_SORT_FIELDS, 'updatedAt'),
        include: {
          createdBy: { select: { id: true, name: true } },
          currentVersion: {
            select: {
              id: true,
              version: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
              createdAt: true,
            },
          },
          _count: { select: { versions: true } },
        },
      }),
      this.prisma.projectFile.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  async findOne(fileId: string, user: AuthUser) {
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        currentVersion: true,
        versions: {
          // Las versiones abandonadas no son historial, son basura.
          where: { uploadStatus: UploadStatus.COMPLETED },
          orderBy: { version: 'desc' },
          include: { uploadedBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    // El guard no cubre esta ruta: el id del proyecto no viaja en ella.
    await this.access.assertMember(file.projectId, user);
    this.assertVisible(file.isVisibleToClient, user);

    return file;
  }

  /**
   * URL de descarga temporal.
   * Se firma solo despues de comprobar permisos; la URL caduca en minutos
   * para que reenviarla por WhatsApp no se convierta en una fuga permanente.
   */
  async getDownloadUrl(fileId: string, versionId: string | undefined, user: AuthUser) {
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, deletedAt: null },
      include: { currentVersion: true },
    });

    if (!file) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    await this.access.assertMember(file.projectId, user);
    this.assertVisible(file.isVisibleToClient, user);

    const version = versionId
      ? await this.prisma.fileVersion.findFirst({
          where: { id: versionId, fileId, uploadStatus: UploadStatus.COMPLETED },
        })
      : file.currentVersion;

    if (!version) {
      throw new NotFoundException('La version solicitada no existe');
    }

    const url = await this.storage.createDownloadUrl(
      version.storageKey,
      version.originalName,
    );

    return {
      url,
      filename: version.originalName,
      version: version.version,
      sizeBytes: version.sizeBytes.toString(),
      expiresIn: 300,
    };
  }

  /**
   * URL de previsualización temporal (disposition inline).
   * Permite que el navegador abra el PDF o imagen embebida en lugar de forzar descarga.
   */
  async getViewUrl(fileId: string, versionId: string | undefined, user: AuthUser) {
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, deletedAt: null },
      include: { currentVersion: true },
    });

    if (!file) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    await this.access.assertMember(file.projectId, user);
    this.assertVisible(file.isVisibleToClient, user);

    const version = versionId
      ? await this.prisma.fileVersion.findFirst({
          where: { id: versionId, fileId, uploadStatus: UploadStatus.COMPLETED },
        })
      : file.currentVersion;

    if (!version) {
      throw new NotFoundException('La version solicitada no existe');
    }

    const url = await this.storage.createViewUrl(
      version.storageKey,
      version.originalName,
      version.mimeType,
    );

    return {
      url,
      filename: version.originalName,
      mimeType: version.mimeType,
      version: version.version,
      sizeBytes: version.sizeBytes.toString(),
      expiresIn: 300,
    };
  }

  // --------------------- CICLO DE SUBIDA ---------------------

  /**
   * Paso 1: crea el contenedor y la version 1 en estado PENDING, y
   * devuelve una URL firmada para que el navegador suba directo a MinIO.
   * El binario nunca pasa por la API.
   */
  async createFile(projectId: string, dto: CreateProjectFileDto, user: AuthUser) {
    this.validator.validate(dto);

    const file = await this.prisma.projectFile.create({
      data: {
        projectId,
        category: dto.category,
        name: dto.name,
        description: dto.description,
        isVisibleToClient: dto.isVisibleToClient ?? true,
        createdById: user.id,
      },
    });

    const intent = await this.createVersionIntent(file.id, dto, user, projectId);

    return { file, upload: intent };
  }

  /** Paso 1 para una version posterior del mismo archivo. */
  async createUploadIntent(fileId: string, dto: UploadIntentDto, user: AuthUser) {
    this.validator.validate(dto);

    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, deletedAt: null },
      select: { id: true, projectId: true, isVisibleToClient: true },
    });

    if (!file) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    await this.access.assertMember(file.projectId, user);

    return this.createVersionIntent(fileId, dto, user, file.projectId);
  }

  /**
   * Paso 3: el navegador ya subio el objeto y avisa.
   *
   * Aqui se leen los metadatos REALES del objeto almacenado en vez de
   * fiarse de lo que declaro el cliente en el paso 1: entre firmar la URL
   * y subir, nada impide mandar un archivo distinto.
   */
  async confirmUpload(
    fileId: string,
    versionId: string,
    dto: ConfirmUploadDto,
    user: AuthUser,
  ) {
    const version = await this.prisma.fileVersion.findFirst({
      where: { id: versionId, fileId },
      include: { file: { select: { id: true, name: true, projectId: true, isVisibleToClient: true } } },
    });

    if (!version) {
      throw new NotFoundException('La version solicitada no existe');
    }
    await this.access.assertMember(version.file.projectId, user);

    if (version.uploadStatus === UploadStatus.COMPLETED) {
      throw new BadRequestException('Esta version ya fue confirmada');
    }

    const meta = await this.storage.getObjectMetadata(version.storageKey);

    if (!meta) {
      await this.prisma.fileVersion.update({
        where: { id: versionId },
        data: { uploadStatus: UploadStatus.FAILED },
      });
      throw new BadRequestException(
        'No se encontro el archivo en el almacenamiento. La subida no se completo.',
      );
    }

    // El tamano real puede diferir del declarado; el limite se aplica igual.
    this.validator.validateSize(meta.sizeBytes);

    const updated = await this.prisma.fileVersion.update({
      where: { id: versionId },
      data: {
        uploadStatus: UploadStatus.COMPLETED,
        sizeBytes: BigInt(meta.sizeBytes),
        mimeType: meta.mimeType,
        checksum: dto.checksum ?? meta.etag?.replace(/"/g, ''),
      },
    });

    await this.prisma.projectFile.update({
      where: { id: fileId },
      data: { currentVersionId: versionId },
    });

    this.events.emit(EVENTS.FILE_VERSION_PUBLISHED, {
      projectId: version.file.projectId,
      containerId: fileId,
      containerName: version.file.name,
      versionId,
      version: version.version,
      actorId: user.id,
      isVisibleToClient: version.file.isVisibleToClient,
    } satisfies VersionPublishedEvent);

    return updated;
  }

  async listVersions(fileId: string, user: AuthUser) {
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, deletedAt: null },
      select: { isVisibleToClient: true, projectId: true },
    });

    if (!file) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    await this.access.assertMember(file.projectId, user);
    this.assertVisible(file.isVisibleToClient, user);

    return this.prisma.fileVersion.findMany({
      where: { fileId, uploadStatus: UploadStatus.COMPLETED },
      orderBy: { version: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  /**
   * Borrado logico del contenedor.
   * Las versiones y sus objetos se conservan: una aprobacion firmada
   * apunta a una version concreta y debe seguir siendo verificable.
   */
  async softDelete(fileId: string, user: AuthUser) {
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!file) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    await this.access.assertMember(file.projectId, user);

    return this.prisma.projectFile.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });
  }

  // ------------------------- INTERNOS -------------------------

  private async createVersionIntent(
    fileId: string,
    dto: UploadIntentDto,
    user: AuthUser,
    projectId: string,
  ) {
    const last = await this.prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (last?.version ?? 0) + 1;

    // La version va EN la ruta: una version nueva no puede sobrescribir
    // el objeto de una anterior ni por accidente.
    const storageKey = this.storage.buildVersionKey({
      projectId,
      kind: 'files',
      containerId: fileId,
      version,
      filename: dto.filename,
    });

    const row = await this.prisma.fileVersion.create({
      data: {
        fileId,
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
      // El navegador DEBE mandar este Content-Type: la firma lo incluye.
      requiredHeaders: { 'Content-Type': dto.mimeType },
    };
  }

  private assertVisible(isVisibleToClient: boolean, user: AuthUser): void {
    if (user.role === Role.CLIENT && !isVisibleToClient) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
  }
}
