"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paginated } from "@/types/api";

/**
 * Paginacion sencilla, hecha a mano porque los `meta` del backend son propios
 * ({total, page, limit, totalPages}) y no encajan con el componente generico.
 */
export function PaginationBar({
  meta,
  onPageChange,
  isLoading = false,
}: {
  meta: Paginated<unknown>["meta"];
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  const { page, limit, total, totalPages } = meta;

  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {from}–{to} de {total}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft />
            Anterior
          </Button>
          <span className="text-muted-foreground text-sm tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
