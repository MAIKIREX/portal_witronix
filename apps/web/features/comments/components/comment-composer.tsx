"use client";

import { useState } from "react";
import type { TargetType } from "@witronix/shared";
import { Lock, MapPin, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { commentsApi } from "../api";

export interface PendingAnchor {
  x: number;
  y: number;
}

export function CommentComposer({
  projectId,
  targetType,
  targetId,
  parentId,
  anchor,
  onClearAnchor,
  onCreated,
  placeholder = "Escribe un comentario…",
  compact = false,
}: {
  projectId: string;
  targetType: TargetType;
  targetId: string;
  parentId?: string;
  /** Punto marcado sobre la imagen, en coordenadas relativas 0-1. */
  anchor?: PendingAnchor | null;
  onClearAnchor?: () => void;
  onCreated: () => void | Promise<void>;
  placeholder?: string;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const { canWriteInternalComments } = usePermissions();

  const { mutate, isPending } = useMutation(
    () =>
      commentsApi.create(projectId, {
        body: body.trim(),
        targetType,
        targetId,
        parentId,
        // Solo se envian si hay ancla: el backend los admite opcionales.
        anchorX: anchor?.x,
        anchorY: anchor?.y,
        // Un CLIENT no puede marcar comentarios internos; el backend lo fuerza
        // a false aunque llegue true, asi que ni siquiera se ofrece.
        isInternal: canWriteInternalComments ? internal : undefined,
      }),
    {
      successToast: parentId ? "Respuesta publicada" : "Comentario publicado",
      onSuccess: () => {
        setBody("");
        setInternal(false);
        onClearAnchor?.();
        void onCreated();
      },
    },
  );

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (body.trim()) void mutate();
      }}
    >
      {anchor && (
        <div className="bg-tone-info text-tone-info-fg flex items-center gap-2 rounded-md px-2 py-1 text-xs">
          <MapPin className="size-3.5" />
          <span className="flex-1">
            Anclado en {Math.round(anchor.x * 100)}% ×{" "}
            {Math.round(anchor.y * 100)}%
          </span>
          {onClearAnchor && (
            <button
              type="button"
              onClick={onClearAnchor}
              aria-label="Quitar el ancla"
              className="hover:opacity-70"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={5000}
        disabled={isPending}
        onKeyDown={(e) => {
          // Atajo habitual en herramientas de revision.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) {
            e.preventDefault();
            void mutate();
          }
        }}
      />

      <div className="flex items-center justify-between gap-2">
        {canWriteInternalComments ? (
          <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
              disabled={isPending}
              className="accent-primary size-3.5"
            />
            <Lock className="size-3" />
            Nota interna (el cliente no la vera)
          </label>
        ) : (
          <span />
        )}

        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          <Send />
          {parentId ? "Responder" : "Comentar"}
        </Button>
      </div>
    </form>
  );
}
