import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  generateToken,
  hashToken,
  parseDuration,
} from '../../common/crypto/token.util';
import type { AuthUser } from '../../common/decorators';
import type { Env } from '../../config/env.validation';
import type {
  AcceptInvitationDto,
  ChangePasswordDto,
  CreateInvitationDto,
  LoginDto,
} from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends TokenPair {
  user: AuthUser;
}

interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly mail: MailService,
  ) {}

  // ------------------------- LOGIN -------------------------

  async login(dto: LoginDto, ctx: RequestContext = {}): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Se verifica el hash incluso si el usuario no existe, con un hash
    // ficticio. Si no, el tiempo de respuesta revela que emails estan
    // registrados y permite enumerar cuentas.
    const hash = user?.passwordHash ?? (await this.dummyHash());
    const valid = await argon2.verify(hash, dto.password).catch(() => false);

    if (!user || !valid) {
      throw new UnauthorizedException('Email o contrasena incorrectos');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Esta cuenta aun no ha aceptado su invitacion',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta esta desactivada');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, randomUUID(), ctx);

    return { ...tokens, user: this.toAuthUser(user) };
  }

  // --------------------- REFRESH TOKENS ---------------------

  /**
   * Rota el refresh token y detecta reuso.
   *
   * Cada token se usa UNA vez. Si llega uno ya consumido significa que
   * alguien tiene una copia robada, asi que se revoca la familia entera
   * y ambas partes quedan fuera: el legitimo volvera a hacer login, el
   * atacante se queda sin nada.
   */
  async refresh(rawToken: string, ctx: RequestContext = {}): Promise<TokenPair> {
    const tokenHash = this.hashRefresh(rawToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Sesion invalida');
    }

    if (stored.revokedAt) {
      this.logger.warn(
        `Reuso de refresh token detectado (usuario ${stored.userId}). ` +
          `Revocando familia ${stored.familyId}.`,
      );
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException(
        'Sesion comprometida. Vuelve a iniciar sesion.',
      );
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesion expirada');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Esta cuenta esta desactivada');
    }

    // Consumir el token actual y emitir el siguiente de la misma familia.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user, stored.familyId, ctx);
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashRefresh(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });

    // Cierra toda la familia, no solo el token actual: cerrar sesion
    // debe invalidar la cadena completa de esa sesion.
    if (stored) {
      await this.deleteSessions({ familyId: stored.familyId });
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.deleteSessions({ userId });
  }

  // --------------------- INVITACIONES ---------------------

  async createInvitation(
    dto: CreateInvitationDto,
    invitedById: string,
  ): Promise<{ id: string; email: string; expiresAt: Date }> {
    if (dto.role === Role.CLIENT && !dto.clientId) {
      throw new BadRequestException(
        'Un usuario con rol CLIENT debe estar asociado a un cliente (clientId)',
      );
    }

    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
        select: { id: true },
      });
      if (!client) {
        throw new BadRequestException('El cliente indicado no existe');
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    // Se crea el usuario sin passwordHash: existe pero no puede entrar
    // hasta aceptar la invitacion y elegir contrasena.
    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        clientId: dto.clientId ?? null,
        passwordHash: null,
      },
    });

    const rawToken = generateToken(32);
    const hours = this.config.get('INVITATION_EXPIRES_HOURS', { infer: true });
    const expiresAt = new Date(Date.now() + hours * 3_600_000);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        clientId: dto.clientId ?? null,
        invitedById,
        tokenHash: this.hashRefresh(rawToken),
        expiresAt,
      },
    });

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
      select: { name: true },
    });

    await this.mail.sendInvitation({
      to: dto.email,
      inviterName: inviter?.name ?? 'El equipo de Witronix',
      token: rawToken,
      expiresAt,
    });

    return { id: invitation.id, email: invitation.email, expiresAt };
  }

  async validateInvitation(
    rawToken: string,
  ): Promise<{ email: string; name: string; role: Role }> {
    const invitation = await this.findUsableInvitation(rawToken);

    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { name: true },
    });

    return {
      email: invitation.email,
      name: user?.name ?? '',
      role: invitation.role,
    };
  }

  async acceptInvitation(
    rawToken: string,
    dto: AcceptInvitationDto,
    ctx: RequestContext = {},
  ): Promise<LoginResult> {
    const invitation = await this.findUsableInvitation(rawToken);

    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new BadRequestException(
        'La cuenta asociada a esta invitacion ya no existe',
      );
    }

    const passwordHash = await argon2.hash(dto.password);

    // Transaccion: si algo falla, la invitacion no queda marcada como
    // aceptada con una cuenta a medio configurar.
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true, lastLoginAt: new Date() },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    const tokens = await this.issueTokens(updated, randomUUID(), ctx);
    return { ...tokens, user: this.toAuthUser(updated) };
  }

  // ------------------ RECUPERAR CONTRASENA ------------------

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Siempre se responde igual, exista o no la cuenta: si no, este
    // endpoint se convierte en un detector de emails registrados.
    if (!user || !user.isActive || !user.passwordHash) {
      return;
    }

    const rawToken = generateToken(32);
    const hours = this.config.get('PASSWORD_RESET_EXPIRES_HOURS', {
      infer: true,
    });

    // Invalidar los anteriores: si alguien pide varios enlaces, solo
    // el ultimo debe servir.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefresh(rawToken),
        expiresAt: new Date(Date.now() + hours * 3_600_000),
      },
    });

    await this.mail.sendPasswordReset({
      to: user.email,
      name: user.name,
      token: rawToken,
    });
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashRefresh(rawToken) },
    });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('El enlace es invalido o ha caducado');
    }

    const passwordHash = await argon2.hash(password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      // Cambiar la contrasena cierra todas las sesiones abiertas: si fue
      // por sospecha de robo, el atacante pierde el acceso ahora mismo.
      // Se borran (no se marcan) para no confundirlas con un token robado.
      this.prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
    ]);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.passwordHash) {
      throw new BadRequestException('La cuenta no tiene contrasena configurada');
    }

    const valid = await argon2
      .verify(user.passwordHash, dto.currentPassword)
      .catch(() => false);

    if (!valid) {
      throw new ForbiddenException('La contrasena actual no es correcta');
    }

    const passwordHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);
  }

  // ------------------------- INTERNOS -------------------------

  private async issueTokens(
    user: User,
    familyId: string,
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES_IN', {
      infer: true,
    });
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES_IN', {
      infer: true,
    });

    // En segundos: el tipo de expiresIn de @nestjs/jwt es un literal muy
    // estrecho ("15m" | "7d" | ...) que un string de configuracion no
    // satisface. Pasar el numero evita el cast y es igual de explicito.
    const accessTtlSeconds = Math.floor(parseDuration(accessExpires) / 1000);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: accessTtlSeconds,
      },
    );

    const rawRefresh = generateToken(48);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefresh(rawRefresh),
        familyId,
        expiresAt: new Date(Date.now() + parseDuration(refreshExpires)),
        userAgent: ctx.userAgent?.slice(0, 255),
        ipAddress: ctx.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      expiresIn: accessTtlSeconds,
    };
  }

  private async findUsableInvitation(rawToken: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.hashRefresh(rawToken) },
    });

    if (!invitation || invitation.revokedAt) {
      throw new BadRequestException('Invitacion invalida');
    }
    if (invitation.acceptedAt) {
      throw new BadRequestException('Esta invitacion ya fue utilizada');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException(
        'Esta invitacion ha caducado. Solicita una nueva.',
      );
    }

    return invitation;
  }

  /**
   * Revoca marcando, sin borrar: la fila debe seguir existiendo para poder
   * detectar que ese token se reutiliza despues.
   */
  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Cierra sesiones borrando las filas, no marcandolas.
   *
   * La diferencia con revokeFamily no es cosmetica: un token que sigue en
   * la tabla marcado como revocado solo puede haber llegado ahi por haber
   * sido consumido en una rotacion, asi que volver a verlo es un robo real.
   * Si el logout tambien dejara filas marcadas, cerrar sesion normalmente
   * acabaria reportando "sesion comprometida" y el aviso perderia sentido.
   */
  private async deleteSessions(where: {
    familyId?: string;
    userId?: string;
  }): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where });
  }

  /** Todos los tokens opacos se guardan como HMAC, nunca en claro. */
  private hashRefresh(rawToken: string): string {
    return hashToken(
      rawToken,
      this.config.get('JWT_REFRESH_SECRET', { infer: true }),
    );
  }

  private dummyHashCache?: string;

  private async dummyHash(): Promise<string> {
    this.dummyHashCache ??= await argon2.hash('usuario-inexistente');
    return this.dummyHashCache;
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId,
    };
  }
}
