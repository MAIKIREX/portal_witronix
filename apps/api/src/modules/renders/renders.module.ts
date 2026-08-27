import { Module } from '@nestjs/common';
import { ProjectRendersController, RendersController } from './renders.controller';
import { RendersService } from './renders.service';

@Module({
  controllers: [ProjectRendersController, RendersController],
  providers: [RendersService],
  exports: [RendersService],
})
export class RendersModule {}
