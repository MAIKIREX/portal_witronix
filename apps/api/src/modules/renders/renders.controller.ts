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
import { RendersService } from './renders.service';
import {
  ConfirmUploadDto,
  CreateRenderDto,
  RenderQueryDto,
  UploadIntentDto,
} from '../files/dto/file.dto';
import {
  CurrentUser,
  ProjectAccess,
  Roles,
  type AuthUser,
} from '../../common/decorators';

@ApiTags('renders')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/renders')
export class ProjectRendersController {
  constructor(private readonly renders: RendersService) {}

  @Get()
  @ProjectAccess()
  @ApiOperation({ summary: 'Listar renders del proyecto' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: RenderQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.findAll(projectId, query, user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ProjectAccess()
  @ApiOperation({
    summary: 'Crear render y obtener URL de subida (paso 1 de 3)',
    description: 'La miniatura se genera sola al confirmar, si el archivo es una imagen.',
  })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateRenderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.createRender(projectId, dto, user);
  }
}

@ApiTags('renders')
@ApiBearerAuth('access-token')
@Controller('renders')
export class RendersController {
  constructor(private readonly renders: RendersService) {}

  @Get(':renderId')
  @ApiOperation({ summary: 'Detalle del render con su historial de versiones' })
  findOne(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.findOne(renderId, user);
  }

  @Get(':renderId/versions')
  @ApiOperation({ summary: 'Listar versiones del render' })
  listVersions(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.listVersions(renderId, user);
  }

  @Post(':renderId/versions/upload-intent')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Nueva version: obtener URL de subida (paso 1)' })
  uploadIntent(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @Body() dto: UploadIntentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.createUploadIntent(renderId, dto, user);
  }

  @Post(':renderId/versions/:versionId/confirm')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Confirmar la subida y publicar la version (paso 3)' })
  confirm(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.confirmUpload(renderId, versionId, dto, user);
  }

  @Get(':renderId/view')
  @ApiOperation({ summary: 'URL temporal del render actual y su miniatura' })
  view(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.getViewUrl(renderId, undefined, user);
  }

  @Get(':renderId/versions/:versionId/view')
  @ApiOperation({ summary: 'URL temporal de una version concreta' })
  viewVersion(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.getViewUrl(renderId, versionId, user);
  }

  @Delete(':renderId')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Eliminar render (borrado logico)' })
  remove(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.renders.softDelete(renderId, user);
  }
}
