"use client";

import { useState } from "react";
import { TargetType } from "@witronix/shared";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState, EmptyState } from "@/components/common/states";
import { useComments } from "../hooks/use-comments";
import { CommentComposer } from "./comment-composer";
import { CommentThreadCard } from "./comment-thread";

/**
 * Todos los hilos del proyecto, incluidos los anclados a renders.
 * Es la vista de conjunto; para responder sobre un punto concreto de una
 * imagen se usa el visor del render.
 */
export function ProjectComments({ projectId }: { projectId: string }) {
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);

  const { data, error, isLoading, refetch } = useComments({
    projectId,
    // Si es false se pasa sin definir: el backend lee `false` como true.
    unresolved: onlyUnresolved || undefined,
  });

  const threads = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          Comentarios del proyecto
          {data ? ` (${data.meta.total})` : ""}
        </h2>
        <Button
          variant={onlyUnresolved ? "secondary" : "outline"}
          size="sm"
          onClick={() => setOnlyUnresolved((v) => !v)}
          aria-pressed={onlyUnresolved}
        >
          Solo sin resolver
        </Button>
      </div>

      <CommentComposer
        projectId={projectId}
        targetType={TargetType.PROJECT}
        targetId={projectId}
        onCreated={refetch}
        placeholder="Escribe un comentario general del proyecto…"
      />

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        }
        isEmpty={(d) => d.data.length === 0}
        empty={
          <EmptyState
            icon={MessagesSquare}
            title={
              onlyUnresolved
                ? "No hay comentarios sin resolver"
                : "Todavia no hay comentarios"
            }
            description={
              onlyUnresolved
                ? "Todos los hilos estan cerrados."
                : "Empieza la conversacion con el equipo."
            }
          />
        }
      >
        {() => (
          <div className="space-y-3">
            {threads.map((thread) => (
              <CommentThreadCard
                key={thread.id}
                thread={thread}
                projectId={projectId}
                onChanged={refetch}
              />
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}
