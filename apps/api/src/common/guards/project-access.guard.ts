import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PROJECT_ACCESS_KEY,
  type AuthUser,
  type ProjectAccessOptions,
} from '../decorators';

/**
 * Verifica que el usuario tenga acceso al proyecto de la ruta.
 *
 * Es la garantia central del portal: ninguna consulta confia en el
 * projectId que llega del cliente. Sin este guard, un cliente que adivine
 * (o encuentre en un log) el UUID de otro proyecto podria leerlo entero.
 *
 * ADMIN y PROJECT_MANAGER ven todos los proyectos por definicion del rol;
 * el resto necesita una fila en ProjectMember.
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ProjectAccessOptions>(
      PROJECT_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: Record<string, string>;
    }>();

    const user = request.user;
    if (!user) throw new ForbiddenException('Acceso denegado');

    const paramName = options.param ?? 'projectId';
    const projectId = request.params[paramName];

    if (!projectId) {
      throw new NotFoundException('Proyecto no especificado');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('El proyecto solicitado no existe');
    }

    // El equipo de gestion tiene visibilidad global.
    if (user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER) {
      return true;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { projectRole: true },
    });

    // Mismo mensaje que un proyecto inexistente: decir "existe pero no
    // puedes verlo" confirmaria a un tercero que ese proyecto es real.
    if (!membership) {
      throw new NotFoundException('El proyecto solicitado no existe');
    }

    if (
      options.projectRoles &&
      options.projectRoles.length > 0 &&
      !options.projectRoles.includes(membership.projectRole)
    ) {
      throw new ForbiddenException(
        'Tu rol en este proyecto no permite esta operacion',
      );
    }

    return true;
  }
}
