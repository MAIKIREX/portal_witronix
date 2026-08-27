import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectRole, Role } from '@prisma/client';
import { ProjectsService } from './projects.service';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectProgressDto,
  UpdateProjectStatusDto,
} from './dto/project.dto';
import {
  CurrentUser,
  ProjectAccess,
  Roles,
  type AuthUser,
} from '../../common/decorators';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar proyectos',
    description:
      'Un usuario CLIENT o TECHNICIAN solo ve los proyectos donde es miembro; ADMIN y PM ven todos.',
  })
  findAll(@Query() query: ProjectQueryDto, @CurrentUser() user: AuthUser) {
    return this.projects.findAll(query, user);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Contadores del dashboard',
    description: 'Proyectos activos, archivos nuevos, aprobaciones y comentarios pendientes.',
  })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.projects.dashboard(user);
  }

  // El guard usa el nombre del parametro de ruta, que aqui es "id".
  @Get(':id')
  @ProjectAccess({ param: 'id' })
  @ApiOperation({ summary: 'Detalle de un proyecto' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.findOne(id, user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({
    summary: 'Crear proyecto',
    description: 'El codigo (PRY-2026-001) se genera solo. Quien lo crea queda como OWNER.',
  })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return this.projects.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ProjectAccess({
    param: 'id',
    projectRoles: [ProjectRole.OWNER, ProjectRole.MANAGER, ProjectRole.COLLABORATOR],
  })
  @ApiOperation({ summary: 'Actualizar proyecto' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ProjectAccess({ param: 'id' })
  @ApiOperation({ summary: 'Cambiar el estado del proyecto' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projects.updateStatus(id, dto.status);
  }

  @Patch(':id/progress')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ProjectAccess({ param: 'id' })
  @ApiOperation({ summary: 'Actualizar el porcentaje de avance' })
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectProgressDto,
  ) {
    return this.projects.updateProgress(id, dto.progress);
  }

  @Post(':id/archive')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ProjectAccess({ param: 'id' })
  @ApiOperation({ summary: 'Archivar proyecto (no borra nada)' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.archive(id);
  }

  @Post(':id/unarchive')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ProjectAccess({ param: 'id' })
  @ApiOperation({ summary: 'Desarchivar proyecto' })
  unarchive(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.unarchive(id);
  }

  // -------------------------- Miembros --------------------------

  @Get(':id/members')
  @ProjectAccess({ param: 'id' })
  @ApiOperation({ summary: 'Listar miembros del proyecto' })
  listMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.listMembers(id);
  }

  @Post(':id/members')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ProjectAccess({ param: 'id' })
  @ApiOperation({
    summary: 'Anadir miembro',
    description:
      'Un usuario CLIENT solo puede anadirse a proyectos de su propia empresa.',
  })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProjectMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.addMember(id, dto, user);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ProjectAccess({ param: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar miembro del proyecto' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.projects.removeMember(id, userId);
  }
}
