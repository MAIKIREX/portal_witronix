import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { ROLES_KEY, type AuthUser } from '../decorators';

/** Restringe rutas por rol global (@Roles). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();

    // Sin usuario aqui significa ruta @Public con @Roles, que es un error
    // de programacion: se deniega en vez de dejar pasar.
    if (!user) {
      throw new ForbiddenException('Acceso denegado');
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para esta operacion',
      );
    }

    return true;
  }
}
