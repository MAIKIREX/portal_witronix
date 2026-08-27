import type { ProjectRole, ProjectStatus, Role } from "@witronix/shared";
import type { PaginationQuery, UserRef } from "@/types/api";

/** Campos propios de un proyecto, tal cual los devuelve el backend. */
export interface Project {
  id: string;
  clientId: string;
  code: string; // PRY-2026-001
  name: string;
  description: string | null;
  location: string | null;
  status: ProjectStatus;
  progress: number; // 0-100
  coverKey: string | null;
  startDate: string | null;
  targetDate: string | null;
  endDate: string | null;
  createdById: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Elemento del listado GET /projects. */
export interface ProjectListItem extends Project {
  client: { id: string; name: string };
  _count: {
    members: number;
    renders: number;
    files: number;
    comments: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
  addedById: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: Role };
}

/** Detalle GET /projects/:id. */
export interface ProjectDetail extends Project {
  client: { id: string; name: string; contactEmail: string | null };
  createdBy: UserRef;
  members: ProjectMember[];
  _count: { renders: number; files: number; comments: number };
}

/**
 * GET /projects/dashboard.
 * `porEstado` trae SIEMPRE las siete claves, tambien las que valen 0.
 */
export interface DashboardSummary {
  totales: { proyectos: number; activos: number };
  porEstado: Record<ProjectStatus, number>;
  novedades: {
    archivosNuevos: number;
    aprobacionesPendientes: number;
    comentariosNuevos: number;
    /** Inicio de la ventana de novedades (ultimos 7 dias). */
    desde: string;
  };
}

export interface ProjectQuery extends PaginationQuery {
  status?: ProjectStatus;
  clientId?: string;
  includeArchived?: boolean;
}

/** Alta de proyecto. El codigo PRY-AAAA-NNN lo asigna el backend. */
export interface CreateProjectInput {
  clientId: string;
  name: string;
  description?: string;
  location?: string;
  status?: ProjectStatus;
  /** Fechas en ISO (YYYY-MM-DD vale: el backend usa @IsDateString). */
  startDate?: string;
  targetDate?: string;
}

/**
 * Edicion. `clientId` no aparece a proposito: el backend lo excluye del DTO,
 * asi que un proyecto no puede cambiar de cliente.
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  location?: string;
  status?: ProjectStatus;
  startDate?: string;
  targetDate?: string;
  endDate?: string;
  progress?: number;
}
