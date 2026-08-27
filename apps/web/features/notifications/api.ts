import { api, buildParams } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type { Notification, NotificationQuery } from "./types";

export const notificationsApi = {
  /** Siempre ordenadas de la mas reciente a la mas antigua. */
  list(
    query: NotificationQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Notification>> {
    return api
      .get<Paginated<Notification>>("/notifications", {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  unreadCount(signal?: AbortSignal): Promise<number> {
    return api
      .get<{ unread: number }>("/notifications/unread-count", { signal })
      .then((r) => r.data.unread);
  },

  markRead(id: string): Promise<void> {
    return api.post(`/notifications/${id}/read`).then(() => undefined);
  },

  /** Devuelve cuantas se han marcado. */
  markAllRead(): Promise<number> {
    return api
      .post<{ updated: number }>("/notifications/read-all")
      .then((r) => r.data.updated);
  },
};
