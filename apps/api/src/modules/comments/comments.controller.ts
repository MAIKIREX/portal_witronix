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
import { CommentsService } from './comments.service';
import {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import {
  CurrentUser,
  ProjectAccess,
  type AuthUser,
} from '../../common/decorators';

@ApiTags('comments')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/comments')
export class ProjectCommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  @ProjectAccess()
  @ApiOperation({
    summary: 'Listar hilos de comentarios',
    description: 'Devuelve los hilos raiz con sus respuestas anidadas. Un CLIENT nunca ve los internos.',
  })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: CommentQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.findAll(projectId, query, user);
  }

  @Post()
  @ProjectAccess()
  @ApiOperation({
    summary: 'Comentar',
    description:
      'Con anchorX/anchorY (0-1) el comentario queda anclado a un punto del render.',
  })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.create(projectId, dto, user);
  }
}

@ApiTags('comments')
@ApiBearerAuth('access-token')
@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Patch(':commentId')
  @ApiOperation({ summary: 'Editar el propio comentario' })
  update(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.update(commentId, dto, user);
  }

  @Post(':commentId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar el hilo como resuelto' })
  resolve(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.resolve(commentId, user);
  }

  @Post(':commentId/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir el hilo' })
  reopen(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.reopen(commentId, user);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar comentario (borrado logico)' })
  async remove(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.comments.softDelete(commentId, user);
  }
}
