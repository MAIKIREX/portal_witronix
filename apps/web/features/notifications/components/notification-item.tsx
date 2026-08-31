"use client";

import Link from "next/link";
import { formatRelative } from "@/lib/format";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_TONES,
  TONE_CLASSES,
  TONE_DOT_CLASSES,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Notification } from "../types";

/**
 * Una notificacion. El `link` lo genera el backend con rutas internas del
 * portal, asi que se usa tal cual.
 *
 * Puede apuntar a algo ya borrado; en ese caso la pantalla destino mostrara su
 * propio mensaje de "no disponible". Es preferible a intentar validar aqui
 * cada enlace antes de pintarlo.
 */
export function NotificationItem({
  notification,
  onOpen,
  compact = false,
}: {
  notification: Notification;
  /** Se marca como leida al abrirla. */
  onOpen: (notification: Notification) => void;
  compact?: boolean;
}) {
  const unread = notification.readAt === null;
  const tone = NOTIFICATION_TYPE_TONES[notification.type];

  const content = (
    <>
      <span
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          unread ? TONE_DOT_CLASSES[tone] : "bg-transparent",
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unread ? "font-medium" : "text-muted-foreground",
            )}
          >
            {notification.title}
          </span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatRelative(notification.createdAt)}
          </span>
        </span>
        {notification.body && !compact && (
          <span className="text-muted-foreground block truncate text-xs">
            {notification.body}
          </span>
        )}
        <span className="text-muted-foreground block text-xs">
          {NOTIFICATION_TYPE_LABELS[notification.type]}
        </span>
      </span>
    </>
  );

  const className = cn(
    "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors",
    unread ? "hover:bg-muted" : "hover:bg-muted/60",
  );

  // Sin enlace la notificacion sigue siendo util como aviso: se puede marcar
  // como leida aunque no lleve a ningun sitio.
  if (!notification.link) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onOpen(notification)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={notification.link}
      className={className}
      onClick={() => onOpen(notification)}
    >
      {content}
    </Link>
  );
}
