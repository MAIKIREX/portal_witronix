import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../decorators';

/**
 * Comprobacion de pertenencia a un proyecto, reutilizable desde servicios.
 *
 * El ProjectAccessGuard solo puede actuar cuando el projectId viaja en la
 * ruta. Muchos recursos (archivos, renders, comentarios, aprobaciones) se
 * direccionan por su propio id, y ahi el guard no tiene nada que mirar:
 * sin esta comprobacion, conocer un UUID bastaria para leer el recurso de
 * otro cliente. Todo servicio que resuelva un recurso por su id debe
 * llamar a assertMember con el proyecto al que pertenece.
 */
@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lanza 404 si el usuario no deberia siquiera saber que el proyecto existe. */
  async assertMember(
    projectId: string,
    user: AuthUser,
    allowedRoles?: ProjectRole[],
  ): Promise<void> {
    if (user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER) {
      return;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { projectRole: true },
    });

    // Mismo mensaje que "no existe": un 403 confirmaria que el recurso
    // es real y de otro cliente.
    if (!membership) {
      throw new NotFoundException('El recurso solicitado no existe');
    }

    if (
      allowedRoles &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(membership.projectRole)
    ) {
      throw new ForbiddenException(
        'Tu rol en este proyecto no permite esta operacion',
      );
    }
  }

  async isMember(projectId: string, user: AuthUser): Promise<boolean> {
    if (user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER) {
      return true;
    }
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { id: true },
    });
    return membership !== null;
  }
}
