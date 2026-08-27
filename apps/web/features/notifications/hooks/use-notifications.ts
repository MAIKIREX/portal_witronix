"use client";

import { useEffect } from "react";
import { useApi } from "@/hooks/use-api";
import type { Paginated } from "@/types/api";
import { notificationsApi } from "../api";
import { useNotificationStore } from "../store";
import type { Notification } from "../types";

/** Cada cuanto se consulta el contador de no leidas. */
const POLL_MS = 60_000;

/**
 * Mantiene vivo el contador global. Se monta UNA sola vez, en la campana:
 * montarlo en varios sitios multiplicaria el sondeo sin ganar nada.
 *
 * Es la forma mas simple de tenerlo al dia sin montar WebSockets: la peticion
 * es trivial y no hay ninguna necesidad de que sea instantaneo.
 */
export function useUnreadCountPolling() {
  const refresh = useNotificationStore((s) => s.refresh);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);

    // Al volver a la pestana conviene refrescar: es cuando el usuario mira.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);
}

export function useNotifications({
  unread,
  limit = 20,
}: { unread?: boolean; limit?: number } = {}) {
  return useApi<Paginated<Notification>>(
    (signal) =>
      // `unread` en false debe ir sin definir: el backend lo leeria como true.
      notificationsApi.list({ unread: unread || undefined, limit }, signal),
    [unread, limit],
    { keepPreviousData: true },
  );
}
