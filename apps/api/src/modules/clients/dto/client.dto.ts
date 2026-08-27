import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateClientDto {
  @ApiProperty({ example: 'Constructora XYZ' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ description: 'NIT', example: '1023456789' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxId?: string;

  @ApiPropertyOptional({ example: 'contacto@constructoraxyz.bo' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email de contacto invalido' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+591 70000001' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
