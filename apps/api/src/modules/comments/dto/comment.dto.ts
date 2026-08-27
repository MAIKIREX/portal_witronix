import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TargetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateCommentDto {
  @ApiProperty({ example: 'Podemos cambiar esta luminaria por una mas calida?' })
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacio' })
  @MaxLength(5000)
  body!: string;

  @ApiProperty({ enum: TargetType })
  @IsEnum(TargetType, { message: 'Tipo de objetivo invalido' })
  targetType!: TargetType;

  @ApiProperty({ description: 'Id del render, archivo o version comentado' })
  @IsUUID(undefined, { message: 'targetId debe ser un UUID valido' })
  targetId!: string;

  @ApiPropertyOptional({ description: 'Responder dentro de un hilo existente' })
  @IsOptional()
  @IsUUID(undefined, { message: 'parentId debe ser un UUID valido' })
  parentId?: string;

  // Relativas (0-1), NO en pixeles: el render se muestra escalado segun la
  // pantalla y unas coordenadas absolutas quedarian descolocadas.
  @ApiPropertyOptional({
    minimum: 0,
    maximum: 1,
    description: 'Posicion horizontal relativa sobre la imagen (0-1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'anchorX debe ser un numero entre 0 y 1' })
  @Min(0)
  @Max(1)
  anchorX?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'anchorY debe ser un numero entre 0 y 1' })
  @Min(0)
  @Max(1)
  anchorY?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Solo visible para el equipo interno. Un CLIENT no puede activarlo.',
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class UpdateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacio' })
  @MaxLength(5000)
  body!: string;
}

export class CommentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TargetType })
  @IsOptional()
  @IsEnum(TargetType, { message: 'Tipo de objetivo invalido' })
  targetType?: TargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'targetId debe ser un UUID valido' })
  targetId?: string;

  @ApiPropertyOptional({ description: 'Solo comentarios sin resolver' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unresolved?: boolean;
}
