import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  CreateInvitationDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { CurrentUser, Public, Roles, type AuthUser } from '../../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  // Limite estricto: 5 intentos por minuto. El limite global es mucho mas
  // laxo y dejaria espacio de sobra para probar contrasenas.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, this.context(req));
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar el access token',
    description:
      'Rota el refresh token. Reutilizar uno ya consumido revoca toda la familia de sesiones.',
  })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, this.context(req));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesion (revoca la familia del token)' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesion en todos los dispositivos' })
  async logoutAll(@CurrentUser('id') userId: string): Promise<void> {
    await this.auth.logoutAll(userId);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @ApiBearerAuth('access-token')
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambiar la propia contrasena' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(userId, dto);
  }

  // --------------------- Invitaciones ---------------------

  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @Post('invitations')
  @ApiOperation({
    summary: 'Invitar a un usuario',
    description: 'Crea la cuenta sin contrasena y envia un email con token de un solo uso.',
  })
  createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.auth.createInvitation(dto, userId);
  }

  @Public()
  @Get('invitations/:token')
  @ApiOperation({ summary: 'Validar un token de invitacion' })
  validateInvitation(@Param('token') token: string) {
    return this.auth.validateInvitation(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('invitations/:token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar invitacion y fijar contrasena',
    description: 'Devuelve tokens de sesion: el usuario entra directo tras aceptar.',
  })
  acceptInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationDto,
    @Req() req: Request,
  ) {
    return this.auth.acceptInvitation(token, dto, this.context(req));
  }

  // ------------------ Recuperar contrasena ------------------

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Solicitar restablecimiento de contrasena',
    description:
      'Responde igual exista o no la cuenta, para no revelar que emails estan registrados.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return {
      message:
        'Si existe una cuenta con ese email, recibiras un enlace para restablecer tu contrasena.',
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Fijar nueva contrasena con el token del email' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  private context(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }
}
