import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { UploadValidatorService } from './upload-validator.service';
import { UploadCleanupService } from './upload-cleanup.service';

@Global()
@Module({
  providers: [StorageService, UploadValidatorService, UploadCleanupService],
  exports: [StorageService, UploadValidatorService],
})
export class StorageModule {}
