import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Contrato de paginacion comun a todos los listados de la API.
 * Tenerlo en un solo sitio evita que cada modulo invente su propio
 * ?limit / ?perPage / ?size y que el frontend tenga que recordar cual usa cada uno.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Busqueda por texto libre' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Campo por el que ordenar' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  /**
   * Resuelve el campo de ordenacion contra una lista blanca.
   *
   * sortBy llega del cliente y va directo a `orderBy` de Prisma. Sin esta
   * comprobacion, un campo inexistente revienta dentro de Prisma y el
   * filtro global lo traduce a un 400 generico que no dice que pasa; y un
   * nombre de relacion produce un orderBy que nadie ha previsto. Cada
   * modulo declara los campos por los que tiene sentido ordenar.
   */
  resolveSort(
    allowed: readonly string[],
    fallback: string,
  ): Record<string, 'asc' | 'desc'> {
    const field =
      this.sortBy && allowed.includes(this.sortBy) ? this.sortBy : fallback;
    return { [field]: this.sortOrder };
  }

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function paginated<T>(
  data: T[],
  total: number,
  query: PaginationQueryDto,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}
