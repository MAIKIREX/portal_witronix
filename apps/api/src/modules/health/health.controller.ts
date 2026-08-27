import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Public } from '../../common/decorators';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Estado de la API y sus dependencias (base de datos y storage)',
  })
  async check() {
    const [db, storage] = await Promise.all([
      this.prisma.isHealthy(),
      this.storage.isHealthy(),
    ]);

    return {
      status: db && storage ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        db: db ? 'ok' : 'error',
        storage: storage ? 'ok' : 'error',
      },
    };
  }
}
