import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FilesService } from './files.service';
import {
  ConfirmUploadDto,
  CreateProjectFileDto,
  FileQueryDto,
  UploadIntentDto,
} from './dto/file.dto';
import {
  CurrentUser,
  ProjectAccess,
  Roles,
  type AuthUser,
} from '../../common/decorators';

/** Listado y creacion, colgando del proyecto (el guard protege :projectId). */
@ApiTags('files')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/files')
export class ProjectFilesController {
  constructor(private readonly files: FilesService) {}

  @Get()
  @ProjectAccess()
  @ApiOperation({ summary: 'Listar archivos del proyecto' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: FileQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.findAll(projectId, query, user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ProjectAccess()
  @ApiOperation({
    summary: 'Crear archivo y obtener URL de subida (paso 1 de 3)',
    description:
      'Devuelve una URL firmada. El navegador sube el binario DIRECTO al almacenamiento (paso 2) y luego confirma (paso 3).',
  })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectFileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.createFile(projectId, dto, user);
  }
}

/** Operaciones sobre un archivo concreto. */
@ApiTags('files')
@ApiBearerAuth('access-token')
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':fileId')
  @ApiOperation({ summary: 'Detalle del archivo con su historial de versiones' })
  findOne(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.findOne(fileId, user);
  }

  @Get(':fileId/versions')
  @ApiOperation({ summary: 'Listar versiones del archivo' })
  listVersions(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.listVersions(fileId, user);
  }

  @Post(':fileId/versions/upload-intent')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Nueva version: obtener URL de subida (paso 1)' })
  uploadIntent(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() dto: UploadIntentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.createUploadIntent(fileId, dto, user);
  }

  @Post(':fileId/versions/:versionId/confirm')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Confirmar la subida (paso 3)',
    description:
      'Verifica el objeto en el almacenamiento y publica la version. Sin este paso la version queda PENDING y se purga.',
  })
  confirm(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.confirmUpload(fileId, versionId, dto, user);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: 'URL de descarga temporal de la version actual' })
  download(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.getDownloadUrl(fileId, undefined, user);
  }

  @Get(':fileId/versions/:versionId/download')
  @ApiOperation({ summary: 'URL de descarga de una version concreta' })
  downloadVersion(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.getDownloadUrl(fileId, versionId, user);
  }

  @Delete(':fileId')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({
    summary: 'Eliminar archivo (borrado logico)',
    description: 'Las versiones se conservan: una aprobacion apunta a una version concreta.',
  })
  remove(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.softDelete(fileId, user);
  }
}
