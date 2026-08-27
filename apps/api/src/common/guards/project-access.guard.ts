import {
  BadRequestException,
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
 * Acepta cualquier version de UUID: Prisma usa la 4, pero validar solo el
 * formato general evita romper si algun dia se generan de otra version.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // Comprobacion de formato ANTES de tocar la base de datos.
    //
    // En Nest los guards se ejecutan ANTES que los pipes, asi que el
    // ParseUUIDPipe del controlador todavia no ha validado nada cuando
    // llegamos aqui. Sin esta guarda, un id malformado se enviaba tal cual a
    // Prisma, que reventaba, y el cliente recibia un 500 "Error al acceder a
    // la base de datos" en lugar de un 400. Ademas de ser el codigo
    // equivocado, convertia cualquier URL con una errata en un error de
    // servidor y ensuciaba la monitorizacion.
    if (!UUID_PATTERN.test(projectId)) {
      throw new BadRequestException(
        `El identificador de proyecto no es valido: ${paramName}`,
      );
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
