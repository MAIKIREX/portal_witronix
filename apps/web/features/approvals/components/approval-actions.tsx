"use client";

import { useState } from "react";
import { ApprovalStatus } from "@witronix/shared";
import { Check, Eye, PenLine, Upload, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { APPROVAL_STATUS_LABELS } from "@/lib/labels";
import { approvalsApi } from "../api";
import type { ApprovalDetail } from "../types";

/** Como se presenta cada transicion: texto del boton, icono y enfasis. */
const ACTION_UI: Partial<
  Record<
    ApprovalStatus,
    { label: string; icon: LucideIcon; variant: "default" | "outline" | "destructive" }
  >
> = {
  [ApprovalStatus.EN_REVISION]: {
    label: "Empezar revision",
    icon: Eye,
    variant: "outline",
  },
  [ApprovalStatus.APROBADO]: {
    label: "Aprobar",
    icon: Check,
    variant: "default",
  },
  [ApprovalStatus.CAMBIOS_SOLICITADOS]: {
    label: "Solicitar cambios",
    icon: PenLine,
    variant: "outline",
  },
  [ApprovalStatus.NUEVA_VERSION]: {
    label: "Marcar nueva version",
    icon: Upload,
    variant: "outline",
  },
  [ApprovalStatus.RECHAZADO]: {
    label: "Rechazar",
    icon: X,
    variant: "destructive",
  },
};

/**
 * Botones de decision.
 *
 * Se generan a partir de `transicionesPosibles`, que calcula el backend. No se
 * replica aqui la maquina de estados: si manana cambia una regla, cambia sola.
 * Cuando la lista llega vacia el estado es terminal y no se muestra nada.
 */
export function ApprovalActions({
  approval,
  onChanged,
}: {
  approval: ApprovalDetail;
  onChanged: () => void | Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const { canSubmitNewVersion } = usePermissions();

  const { mutate, isPending } = useMutation(
    (to: ApprovalStatus) =>
      approvalsApi.transition(approval.id, to, comment.trim() || undefined),
    {
      successToast: (updated) =>
        `Estado actualizado a ${APPROVAL_STATUS_LABELS[updated.status]}`,
      onSuccess: () => {
        setComment("");
        // La respuesta no trae eventos ni transiciones: hay que refrescar.
        void onChanged();
      },
    },
  );

  const available = approval.transicionesPosibles.filter((status) => {
    // Marcar "nueva version" es cosa del equipo, no del cliente
    // (@Roles(ADMIN, PROJECT_MANAGER, TECHNICIAN) en el backend).
    if (status === ApprovalStatus.NUEVA_VERSION) return canSubmitNewVersion;
    return ACTION_UI[status] !== undefined;
  });

  if (available.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
        Esta aprobacion esta cerrada y no admite mas cambios.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario de la decision (opcional)"
        rows={2}
        maxLength={2000}
        disabled={isPending}
      />
      <div className="flex flex-wrap gap-2">
        {available.map((status) => {
          const ui = ACTION_UI[status]!;
          const Icon = ui.icon;
          return (
            <Button
              key={status}
              variant={ui.variant}
              size="sm"
              disabled={isPending}
              onClick={() => void mutate(status)}
            >
              <Icon />
              {ui.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
