import { ApprovalStatus, type TargetType } from "@witronix/shared";
import { api, buildParams } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type {
  Approval,
  ApprovalDetail,
  ApprovalListItem,
  ApprovalQuery,
} from "./types";

/**
 * Cada estado destino tiene su propio endpoint; no hay un PATCH generico.
 * Este mapa traduce el estado que devuelve `transicionesPosibles` al endpoint
 * correspondiente, de modo que la interfaz solo tenga que leer esa lista.
 */
const ENDPOINT_BY_STATUS: Partial<Record<ApprovalStatus, string>> = {
  [ApprovalStatus.EN_REVISION]: "review",
  [ApprovalStatus.APROBADO]: "approve",
  [ApprovalStatus.CAMBIOS_SOLICITADOS]: "request-changes",
  [ApprovalStatus.NUEVA_VERSION]: "new-version",
  [ApprovalStatus.RECHAZADO]: "reject",
};

export const approvalsApi = {
  list(
    projectId: string,
    query: ApprovalQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ApprovalListItem>> {
    return api
      .get<Paginated<ApprovalListItem>>(`/projects/${projectId}/approvals`, {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  detail(approvalId: string, signal?: AbortSignal): Promise<ApprovalDetail> {
    return api
      .get<ApprovalDetail>(`/approvals/${approvalId}`, { signal })
      .then((r) => r.data);
  },

  create(
    projectId: string,
    input: { targetType: TargetType; targetId: string; comment?: string },
  ): Promise<Approval> {
    return api
      .post<Approval>(`/projects/${projectId}/approvals`, input)
      .then((r) => r.data);
  },

  /**
   * Aplica una transicion.
   *
   * OJO: la respuesta trae SOLO la aprobacion actualizada, sin `events` ni
   * `transicionesPosibles`. Hay que volver a pedir el detalle para refrescar
   * el historico y los botones disponibles.
   */
  transition(
    approvalId: string,
    to: ApprovalStatus,
    comment?: string,
  ): Promise<Approval> {
    const endpoint = ENDPOINT_BY_STATUS[to];
    if (!endpoint) {
      throw new Error(`No hay endpoint para la transicion a ${to}`);
    }
    return api
      .post<Approval>(
        `/approvals/${approvalId}/${endpoint}`,
        comment ? { comment } : {},
      )
      .then((r) => r.data);
  },
};
