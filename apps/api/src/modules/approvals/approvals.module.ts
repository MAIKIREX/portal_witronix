import { Module } from '@nestjs/common';
import { ApprovalsController, ProjectApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  controllers: [ProjectApprovalsController, ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
