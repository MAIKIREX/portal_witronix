import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalStatus, Role } from '@prisma/client';
import { ApprovalsService } from './approvals.service';
import {
  ApprovalQueryDto,
  CreateApprovalDto,
  DecideApprovalDto,
} from './dto/approval.dto';
import {
  CurrentUser,
  ProjectAccess,
  Roles,
  type AuthUser,
} from '../../common/decorators';

@ApiTags('approvals')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/approvals')
export class ProjectApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @ProjectAccess()
  @ApiOperation({ summary: 'Listar aprobaciones del proyecto' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ApprovalQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.findAll(projectId, query, user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @ProjectAccess()
  @ApiOperation({
    summary: 'Solicitar aprobacion de un render o archivo',
    description: 'Solo puede haber una aprobacion abierta por elemento.',
  })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.create(projectId, dto, user);
  }
}

@ApiTags('approvals')
@ApiBearerAuth('access-token')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get(':approvalId')
  @ApiOperation({
    summary: 'Detalle de la aprobacion',
    description: 'Incluye transicionesPosibles para que el frontend sepa que ofrecer.',
  })
  findOne(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.findOne(approvalId, user);
  }

  @Get(':approvalId/events')
  @ApiOperation({
    summary: 'Historial completo de la aprobacion',
    description: 'Quien hizo cada cambio de estado y cuando. Trazabilidad seccion 7.',
  })
  listEvents(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.listEvents(approvalId, user);
  }

  @Post(':approvalId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar como en revision' })
  review(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.transition(approvalId, ApprovalStatus.EN_REVISION, dto, user);
  }

  @Post(':approvalId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar' })
  approve(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.transition(approvalId, ApprovalStatus.APROBADO, dto, user);
  }

  @Post(':approvalId/request-changes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar cambios' })
  requestChanges(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.transition(
      approvalId,
      ApprovalStatus.CAMBIOS_SOLICITADOS,
      dto,
      user,
    );
  }

  @Post(':approvalId/new-version')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notificar que se publico una nueva version' })
  newVersion(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.transition(
      approvalId,
      ApprovalStatus.NUEVA_VERSION,
      dto,
      user,
    );
  }

  @Post(':approvalId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar' })
  reject(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.approvals.transition(approvalId, ApprovalStatus.RECHAZADO, dto, user);
  }
}
