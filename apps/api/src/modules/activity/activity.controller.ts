import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  CurrentUser,
  ProjectAccess,
  type AuthUser,
} from '../../common/decorators';

@ApiTags('activity')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  @ProjectAccess()
  @ApiOperation({
    summary: 'Linea de tiempo del proyecto',
    description: 'Historial completo de lo que ha pasado, del mas reciente al mas antiguo.',
  })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activity.findByProject(projectId, query, user);
  }
}
