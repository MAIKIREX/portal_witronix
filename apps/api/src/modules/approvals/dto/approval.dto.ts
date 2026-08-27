import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus, TargetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateApprovalDto {
  @ApiProperty({
    enum: TargetType,
    description: 'Solo se aprueban renders, archivos o sus versiones',
  })
  @IsEnum(TargetType, { message: 'Tipo de objetivo invalido' })
  targetType!: TargetType;

  @ApiProperty()
  @IsUUID(undefined, { message: 'targetId debe ser un UUID valido' })
  targetId!: string;

  @ApiPropertyOptional({ description: 'Nota para quien debe decidir' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class DecideApprovalDto {
  @ApiPropertyOptional({ description: 'Motivo de la decision' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class ApprovalQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ApprovalStatus })
  @IsOptional()
  @IsEnum(ApprovalStatus, { message: 'Estado de aprobacion invalido' })
  status?: ApprovalStatus;

  @ApiPropertyOptional({ enum: TargetType })
  @IsOptional()
  @IsEnum(TargetType, { message: 'Tipo de objetivo invalido' })
  targetType?: TargetType;

  @ApiPropertyOptional({ description: 'Solo pendientes o en revision' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pending?: boolean;
}
