import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/** Normaliza emails: se guardan y comparan siempre en minusculas. */
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/**
 * Requisitos de contrasena. Se exige longitud y variedad porque estas
 * cuentas dan acceso a documentacion tecnica y planos de clientes.
 */
const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]{10,}$/;
const PASSWORD_MESSAGE =
  'La contrasena debe tener al menos 10 caracteres, con mayuscula, minuscula y numero';

export class LoginDto {
  @ApiProperty({ example: 'admin@witronixled.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email invalido' })
  email!: string;

  @ApiProperty({ example: 'Witronix2026!' })
  @IsString()
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class CreateInvitationDto {
  @ApiProperty({ example: 'nuevo.cliente@empresa.bo' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email invalido' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.CLIENT })
  @IsEnum(Role, { message: 'Rol invalido' })
  role!: Role;

  @ApiPropertyOptional({
    description: 'Obligatorio cuando el rol es CLIENT: empresa a la que pertenece',
  })
  @IsOptional()
  // Sin fijar version: los datos de ejemplo usan UUIDs legibles
  // (1111...-1111) que no son v4, y exigir v4 los rechazaria.
  @IsUUID(undefined, { message: 'clientId debe ser un UUID valido' })
  clientId?: string;

  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name!: string;
}

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Nueva contrasena' })
  @IsString()
  @MaxLength(128)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email invalido' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
