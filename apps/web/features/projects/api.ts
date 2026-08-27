import type { ProjectRole, ProjectStatus } from "@witronix/shared";
import { api, buildParams } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type {
  CreateProjectInput,
  DashboardSummary,
  ProjectDetail,
  ProjectListItem,
  ProjectMember,
  ProjectQuery,
  UpdateProjectInput,
} from "./types";

/**
 * Llamadas de proyectos.
 *
 * Todas aceptan un AbortSignal para que useApi pueda cancelarlas.
 * Los parametros pasan siempre por buildParams: nunca se construye un query
 * string a mano (ver la trampa de los booleanos en lib/http/query.ts).
 */
export const projectsApi = {
  list(
    query: ProjectQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ProjectListItem>> {
    return api
      .get<Paginated<ProjectListItem>>("/projects", {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  dashboard(signal?: AbortSignal): Promise<DashboardSummary> {
    return api
      .get<DashboardSummary>("/projects/dashboard", { signal })
      .then((r) => r.data);
  },

  detail(id: string, signal?: AbortSignal): Promise<ProjectDetail> {
    return api
      .get<ProjectDetail>(`/projects/${id}`, { signal })
      .then((r) => r.data);
  },

  members(id: string, signal?: AbortSignal): Promise<ProjectMember[]> {
    return api
      .get<ProjectMember[]>(`/projects/${id}/members`, { signal })
      .then((r) => r.data);
  },

  // --- Escrituras ---
  // El backend usa forbidNonWhitelisted: cualquier campo de mas en el cuerpo
  // provoca un 400. Por eso se envia solo el campo que cambia, nunca la
  // entidad entera de vuelta.

  /** El codigo PRY-AAAA-NNN lo genera el backend; no se envia. */
  create(input: CreateProjectInput): Promise<ProjectDetail> {
    return api.post<ProjectDetail>("/projects", input).then((r) => r.data);
  },

  /** `clientId` NO se puede cambiar: el backend lo excluye del DTO. */
  update(id: string, input: UpdateProjectInput): Promise<ProjectDetail> {
    return api
      .patch<ProjectDetail>(`/projects/${id}`, input)
      .then((r) => r.data);
  },

  addMember(
    id: string,
    userId: string,
    projectRole: ProjectRole,
  ): Promise<ProjectMember> {
    return api
      .post<ProjectMember>(`/projects/${id}/members`, { userId, projectRole })
      .then((r) => r.data);
  },

  removeMember(id: string, userId: string): Promise<void> {
    return api
      .delete(`/projects/${id}/members/${userId}`)
      .then(() => undefined);
  },

  updateStatus(id: string, status: ProjectStatus): Promise<ProjectDetail> {
    return api
      .patch<ProjectDetail>(`/projects/${id}/status`, { status })
      .then((r) => r.data);
  },

  updateProgress(id: string, progress: number): Promise<ProjectDetail> {
    return api
      .patch<ProjectDetail>(`/projects/${id}/progress`, { progress })
      .then((r) => r.data);
  },

  archive(id: string): Promise<ProjectDetail> {
    return api
      .post<ProjectDetail>(`/projects/${id}/archive`)
      .then((r) => r.data);
  },

  unarchive(id: string): Promise<ProjectDetail> {
    return api
      .post<ProjectDetail>(`/projects/${id}/unarchive`)
      .then((r) => r.data);
  },
};
