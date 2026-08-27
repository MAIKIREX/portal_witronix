"use client";

import { useState } from "react";
import type { TargetType } from "@witronix/shared";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";
import type { CommentThread as Thread } from "../types";

export function CommentThreadCard({
  thread,
  projectId,
  onChanged,
  highlighted = false,
  onFocusAnchor,
}: {
  thread: Thread;
  projectId: string;
  onChanged: () => void | Promise<void>;
  highlighted?: boolean;
  /** Al pulsar un hilo anclado, el visor resalta su marca. */
  onFocusAnchor?: (thread: Thread) => void;
}) {
  const [replying, setReplying] = useState(false);
  const isAnchored = thread.anchorX !== null && thread.anchorY !== null;

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-3 transition-colors",
        highlighted && "border-primary bg-primary/5",
        isAnchored && onFocusAnchor && "cursor-pointer",
      )}
      onClick={isAnchored && onFocusAnchor ? () => onFocusAnchor(thread) : undefined}
    >
      <CommentItem comment={thread} onChanged={onChanged} />

      {thread.replies.length > 0 && (
        <div className="space-y-3">
          {thread.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onChanged={onChanged}
              isReply
            />
          ))}
        </div>
      )}

      {/* Los hilos son de un solo nivel: se responde siempre al comentario
          raiz, nunca a una respuesta. */}
      {replying ? (
        <div
          className="ml-4 border-l pl-4"
          onClick={(e) => e.stopPropagation()}
        >
          <CommentComposer
            projectId={projectId}
            targetType={thread.targetType as TargetType}
            targetId={thread.targetId}
            parentId={thread.id}
            placeholder="Escribe tu respuesta…"
            compact
            onCreated={async () => {
              setReplying(false);
              await onChanged();
            }}
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            setReplying(true);
          }}
        >
          <MessageSquarePlus />
          Responder
        </Button>
      )}
    </div>
  );
}
