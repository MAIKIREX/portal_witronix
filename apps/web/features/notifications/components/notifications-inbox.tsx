"use client";

import { useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { useMutation } from "@/hooks/use-mutation";
import { notificationsApi } from "../api";
import { useNotifications } from "../hooks/use-notifications";
import { useNotificationStore } from "../store";
import type { Notification } from "../types";
import { NotificationItem } from "./notification-item";

export function NotificationsInbox() {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const list = useNotifications({ unread: onlyUnread, limit: 50 });

  // El contador se lee del store compartido, para que la campana de la
  // cabecera y esta pantalla no puedan discrepar.
  const unread = useNotificationStore((s) => s.unread);
  const refreshCount = useNotificationStore((s) => s.refresh);
  const decrement = useNotificationStore((s) => s.decrement);

  const markAll = useMutation(() => notificationsApi.markAllRead(), {
    successToast: (updated) =>
      updated > 0
        ? `${updated} notificaciones marcadas como leidas`
        : "No habia nada sin leer",
    onSuccess: () => {
      void refreshCount();
      void list.refetch();
    },
  });

  async function handleOpen(notification: Notification) {
    if (notification.readAt) return;
    decrement();
    try {
      await notificationsApi.markRead(notification.id);
    } finally {
      void refreshCount();
      void list.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant={onlyUnread ? "secondary" : "outline"}
          size="sm"
          onClick={() => setOnlyUnread((v) => !v)}
          aria-pressed={onlyUnread}
        >
          Solo sin leer{unread > 0 ? ` (${unread})` : ""}
        </Button>

        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => void markAll.mutate()}
          >
            <CheckCheck />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      <DataState
        isLoading={list.isLoading}
        error={list.error}
        data={list.data}
        onRetry={list.refetch}
        skeleton={
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        }
        isEmpty={(d) => d.data.length === 0}
        empty={
          <EmptyState
            icon={BellOff}
            title={
              onlyUnread
                ? "No tienes notificaciones sin leer"
                : "No tienes notificaciones"
            }
            description={
              onlyUnread
                ? "Estas al dia."
                : "Aqui apareceran los avisos de tus proyectos."
            }
          />
        }
      >
        {(page) => (
          <ul className="divide-y rounded-lg border">
            {page.data.map((notification) => (
              <li key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onOpen={handleOpen}
                />
              </li>
            ))}
          </ul>
        )}
      </DataState>
    </div>
  );
}
