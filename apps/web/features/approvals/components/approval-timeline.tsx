"use client";

import { ApprovalStatusBadge } from "@/components/common/status-badge";
import { formatDateTime, initials } from "@/lib/format";
import type { ApprovalEvent } from "../types";

/**
 * Historico de la aprobacion. Es append-only en el backend: cada decision deja
 * un evento, y ninguno se modifica ni se borra.
 */
export function ApprovalTimeline({ events }: { events: ApprovalEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavia no hay movimientos.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
              aria-hidden="true"
            >
              {initials(event.actor.name)}
            </span>
            {index < events.length - 1 && (
              <span className="bg-border mt-1 w-px flex-1" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1 pb-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{event.actor.name}</span>
              <ApprovalStatusBadge status={event.toStatus} />
            </div>
            <p className="text-muted-foreground text-xs">
              {formatDateTime(event.createdAt)}
            </p>
            {event.comment && (
              <p className="bg-muted rounded-md px-2 py-1.5 text-sm whitespace-pre-line">
                {event.comment}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
