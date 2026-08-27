import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileCategory, RenderType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** Datos del archivo que el cliente quiere subir. */
export class UploadIntentDto {
  @ApiProperty({ example: 'plano_iluminacion_v1.pdf' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del archivo es obligatorio' })
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty({ message: 'El tipo MIME es obligatorio' })
  @MaxLength(160)
  mimeType!: string;

  @ApiProperty({ description: 'Tamano en bytes', example: 2400000 })
  @Type(() => Number)
  @IsInt({ message: 'El tamano debe ser un numero entero de bytes' })
  @Min(1, { message: 'El archivo esta vacio' })
  sizeBytes!: number;

  @ApiPropertyOptional({ description: 'Notas de esta version' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateProjectFileDto extends UploadIntentDto {
  @ApiProperty({ enum: FileCategory })
  @IsEnum(FileCategory, { message: 'Categoria de archivo invalida' })
  category!: FileCategory;

  @ApiProperty({ example: 'Plano de iluminacion - Planta baja' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Si es false, solo lo ve el equipo interno',
  })
  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;
}

export class CreateRenderDto extends UploadIntentDto {
  @ApiProperty({ example: 'Lobby principal' })
  @IsString()
  @IsNotEmpty({ message: 'El titulo es obligatorio' })
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Recepcion' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @ApiPropertyOptional({ enum: RenderType, default: RenderType.INTERIOR })
  @IsOptional()
  @IsEnum(RenderType, { message: 'Tipo de render invalido' })
  type?: RenderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;
}

export class ConfirmUploadDto {
  @ApiPropertyOptional({
    description: 'Checksum SHA-256 calculado por el cliente (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  checksum?: string;
}

export class FileQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FileCategory })
  @IsOptional()
  @IsEnum(FileCategory, { message: 'Categoria de archivo invalida' })
  category?: FileCategory;
}

export class RenderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RenderType })
  @IsOptional()
  @IsEnum(RenderType, { message: 'Tipo de render invalido' })
  type?: RenderType;
}

export class VersionParamDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  version?: number;
}
