"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@/hooks/use-mutation";
import { notificationsApi } from "../api";
import {
  useNotifications,
  useUnreadCountPolling,
} from "../hooks/use-notifications";
import { useNotificationStore } from "../store";
import type { Notification } from "../types";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  // El sondeo del contador vive aqui y solo aqui: es el unico componente
  // presente en todas las pantallas.
  useUnreadCountPolling();

  const unread = useNotificationStore((s) => s.unread);
  const refreshCount = useNotificationStore((s) => s.refresh);
  const decrement = useNotificationStore((s) => s.decrement);

  const list = useNotifications({ limit: 8 });

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
    setOpen(false);
    if (notification.readAt) return;
    // El numero baja al instante y despues se confirma con el servidor.
    decrement();
    try {
      await notificationsApi.markRead(notification.id);
    } finally {
      void refreshCount();
      void list.refetch();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative size-9 rounded-full border-border bg-white/80 dark:bg-[#0d1926]/75 hover:bg-white hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all duration-200 shadow-2xs"
          />
        }
        aria-label={
          unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"
        }
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold shadow-xs">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notificaciones</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="xs"
              disabled={markAll.isPending}
              onClick={() => void markAll.mutate()}
            >
              <CheckCheck />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-1">
          {list.isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : list.data && list.data.data.length > 0 ? (
            list.data.data.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={handleOpen}
                compact
              />
            ))
          ) : (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              No tienes notificaciones.
            </p>
          )}
        </div>

        <div className="border-t p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            render={<Link href="/notificaciones" />}
            nativeButton={false}
            onClick={() => setOpen(false)}
          >
            Ver todas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
