import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role, ProjectRole } from '@prisma/client';

/** Usuario autenticado, tal como lo deja la estrategia JWT en la request. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId: string | null;
}

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PROJECT_ACCESS_KEY = 'projectAccess';

/**
 * Marca una ruta como accesible sin token.
 * El JwtAuthGuard es global, asi que sin este decorador TODO exige login:
 * el olvido seguro es dejar algo protegido, no dejarlo abierto.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe la ruta a ciertos roles globales. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export interface ProjectAccessOptions {
  /** Nombre del parametro de ruta que contiene el id del proyecto. */
  param?: string;
  /** Roles de proyecto admitidos. Si se omite, basta con ser miembro. */
  projectRoles?: ProjectRole[];
}

/**
 * Exige que el usuario sea miembro del proyecto indicado en la ruta.
 * Es la garantia central del portal: sin esto, un cliente que adivine
 * un UUID podria leer el proyecto de otro cliente.
 */
export const ProjectAccess = (options: ProjectAccessOptions = {}) =>
  SetMetadata(PROJECT_ACCESS_KEY, { param: 'projectId', ...options });

/** Inyecta el usuario autenticado en el handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
