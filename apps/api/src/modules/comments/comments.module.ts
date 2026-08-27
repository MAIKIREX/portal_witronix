import { Module } from '@nestjs/common';
import { CommentsController, ProjectCommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [ProjectCommentsController, CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
