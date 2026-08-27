import { api, buildParams } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type {
  Client,
  ClientDetail,
  ClientQuery,
  CreateClientInput,
  UpdateClientInput,
} from "./types";

/**
 * Clientes. Todo el controlador esta restringido a ADMIN y PROJECT_MANAGER,
 * y el borrado solo a ADMIN.
 */
export const clientsApi = {
  list(
    query: ClientQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Client>> {
    return api
      .get<Paginated<Client>>("/clients", {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  detail(id: string, signal?: AbortSignal): Promise<ClientDetail> {
    return api
      .get<ClientDetail>(`/clients/${id}`, { signal })
      .then((r) => r.data);
  },

  create(input: CreateClientInput): Promise<Client> {
    return api.post<Client>("/clients", input).then((r) => r.data);
  },

  update(id: string, input: UpdateClientInput): Promise<Client> {
    return api.patch<Client>(`/clients/${id}`, input).then((r) => r.data);
  },

  /**
   * DESACTIVA el cliente, no lo borra: el backend hace baja logica para no
   * romper el historico de los proyectos. Solo ADMIN.
   */
  deactivate(id: string): Promise<void> {
    return api.delete(`/clients/${id}`).then(() => undefined);
  },
};
