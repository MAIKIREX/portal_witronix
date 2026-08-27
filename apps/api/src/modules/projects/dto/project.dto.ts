import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { ProjectRole, ProjectStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateProjectDto {
  @ApiProperty({ description: 'Empresa cliente propietaria del proyecto' })
  @IsUUID(undefined, { message: 'clientId debe ser un UUID valido' })
  clientId!: string;

  @ApiProperty({ example: 'Edificio Mirador' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proyecto es obligatorio' })
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'La Paz, Bolivia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.POR_INICIAR })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Estado de proyecto invalido' })
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'startDate debe ser una fecha ISO valida' })
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'targetDate debe ser una fecha ISO valida' })
  targetDate?: string;
}

/** El cliente de un proyecto no se cambia: se crea otro proyecto. */
export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, ['clientId'] as const),
) {
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'endDate debe ser una fecha ISO valida' })
  endDate?: string;
}

export class UpdateProjectStatusDto {
  @ApiProperty({ enum: ProjectStatus })
  @IsEnum(ProjectStatus, { message: 'Estado de proyecto invalido' })
  status!: ProjectStatus;
}

export class UpdateProjectProgressDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt({ message: 'El avance debe ser un numero entero' })
  @Min(0, { message: 'El avance no puede ser menor que 0' })
  @Max(100, { message: 'El avance no puede ser mayor que 100' })
  progress!: number;
}

export class AddProjectMemberDto {
  @ApiProperty()
  @IsUUID(undefined, { message: 'userId debe ser un UUID valido' })
  userId!: string;

  @ApiPropertyOptional({ enum: ProjectRole, default: ProjectRole.VIEWER })
  @IsOptional()
  @IsEnum(ProjectRole, { message: 'Rol de proyecto invalido' })
  projectRole?: ProjectRole;
}

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Estado de proyecto invalido' })
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'clientId debe ser un UUID valido' })
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Incluir proyectos archivados',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeArchived?: boolean;
}
