"use client";

import { useState } from "react";
import { Check, Lock, MapPin, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { Role } from "@witronix/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@/hooks/use-mutation";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { commentsApi } from "../api";
import type { Comment } from "../types";

export function CommentItem({
  comment,
  onChanged,
  isReply = false,
}: {
  comment: Comment;
  onChanged: () => void | Promise<void>;
  isReply?: boolean;
}) {
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  const isAuthor = comment.authorId === user.id;
  const isAdmin = user.role === Role.ADMIN;
  const resolved = Boolean(comment.resolvedAt);

  const edit = useMutation(
    (body: string) => commentsApi.update(comment.id, body),
    { successToast: "Comentario editado", onSuccess: () => { setEditing(false); void onChanged(); } },
  );
  const resolve = useMutation(() => commentsApi.resolve(comment.id), {
    onSuccess: () => void onChanged(),
  });
  const reopen = useMutation(() => commentsApi.reopen(comment.id), {
    onSuccess: () => void onChanged(),
  });
  const remove = useMutation(() => commentsApi.remove(comment.id), {
    successToast: "Comentario eliminado",
    onSuccess: () => void onChanged(),
  });

  return (
    <article
      className={cn(
        "space-y-2",
        isReply && "border-muted ml-4 border-l pl-4",
        resolved && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
          aria-hidden="true"
        >
          {initials(comment.author.name)}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-muted-foreground">
              {formatRelative(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-muted-foreground">(editado)</span>
            )}
            {comment.isInternal && (
              <span className="bg-tone-warning text-tone-warning-fg inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                <Lock className="size-3" />
                interno
              </span>
            )}
            {comment.anchorX !== null && (
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="size-3" />
                anclado
              </span>
            )}
            {resolved && (
              <span className="bg-tone-success text-tone-success-fg rounded px-1.5 py-0.5">
                resuelto
              </span>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={5000}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="xs"
                  disabled={edit.isPending || !draft.trim()}
                  onClick={() => void edit.mutate(draft.trim())}
                >
                  Guardar
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setDraft(comment.body);
                    setEditing(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-line">{comment.body}</p>
          )}
        </div>

        {!editing && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" />}
              aria-label="Acciones del comentario"
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Resolver esta abierto a cualquier miembro: el backend no lo
                  restringe al autor y a menudo lo cierra quien aplico el cambio. */}
              {!isReply &&
                (resolved ? (
                  <DropdownMenuItem
                    disabled={reopen.isPending}
                    onClick={() => void reopen.mutate()}
                  >
                    <RotateCcw />
                    Reabrir
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={resolve.isPending}
                    onClick={() => void resolve.mutate()}
                  >
                    <Check />
                    Marcar como resuelto
                  </DropdownMenuItem>
                ))}
              {isAuthor && (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  Editar
                </DropdownMenuItem>
              )}
              {(isAuthor || isAdmin) && (
                <DropdownMenuItem
                  disabled={remove.isPending}
                  onClick={() => void remove.mutate()}
                >
                  <Trash2 />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  );
}
