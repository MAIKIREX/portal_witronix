import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/**
 * Tiene que ser una CLASE, no un tipo interseccion.
 *
 * El ValidationPipe se guia por el metatipo reflejado en tiempo de
 * ejecucion. Con `PaginationQueryDto & { unread?: boolean }` ese metatipo
 * es Object, asi que no transforma nada: `limit` llega como el string "5"
 * y revienta dentro de Prisma con un error que no apunta al origen.
 */
export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Solo las no leidas' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unread?: boolean;
}
