"use client";

import { useState } from "react";
import Link from "next/link";
import { FileCategory } from "@witronix/shared";
import { Download, EyeOff, FileText, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataState, EmptyState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { formatBytes, formatDate } from "@/lib/format";
import { FILE_CATEGORY_LABELS } from "@/lib/labels";
import type { Paginated } from "@/types/api";
import { filesApi } from "../api";
import type { FileListItem } from "../types";
import { UploadFileDialog } from "./upload-file-dialog";
import { DownloadButton } from "./download-button";

const CATEGORY_ITEMS = [
  { value: "", label: "Todas las categorias" },
  ...Object.values(FileCategory).map((c) => ({
    value: c,
    label: FILE_CATEGORY_LABELS[c],
  })),
];

export function FilesList({ projectId }: { projectId: string }) {
  const [category, setCategory] = useState<FileCategory | "">("");
  const { canUpload } = usePermissions();

  const { data, error, isLoading, refetch } = useApi<Paginated<FileListItem>>(
    (signal) =>
      filesApi.list(projectId, { category: category || undefined }, signal),
    [projectId, category],
    { keepPreviousData: true },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          items={CATEGORY_ITEMS}
          value={category}
          onValueChange={(value) => setCategory((value ?? "") as FileCategory | "")}
        >
          <SelectTrigger className="w-56" aria-label="Filtrar por categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_ITEMS.map((item) => (
              <SelectItem key={item.value || "todas"} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canUpload && (
          <UploadFileDialog projectId={projectId} onUploaded={refetch} />
        )}
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={refetch}
        skeleton={
          <div className="space-y-2 rounded-lg border p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        }
        isEmpty={(d) => d.data.length === 0}
        empty={
          <EmptyState
            icon={FileText}
            title={
              category
                ? "No hay documentos de esa categoria"
                : "Todavia no hay documentos"
            }
            description={
              canUpload
                ? "Sube planos, fichas tecnicas o certificaciones."
                : "Cuando el equipo suba documentacion aparecera aqui."
            }
          />
        }
      >
        {(page) => (
          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-14 font-mono text-[11px] text-muted-foreground/80">
                    (#)
                  </TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Categoria
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Tamano</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Actualizado
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.data.map((file, index) => (
                  <TableRow
                    key={file.id}
                    className="group border-b border-border/70 hover:bg-[#ecf2f9]/50 transition-colors"
                  >
                    <TableCell className="w-14 font-mono text-xs text-muted-foreground/50 tabular-nums">
                      ({String(index + 1).padStart(2, "0")})
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/proyectos/${projectId}/archivos/${file.id}`}
                        className="group-hover:text-primary block font-medium text-base text-foreground transition-colors"
                      >
                        {file.name}
                      </Link>
                      <span className="text-muted-foreground text-xs font-mono">
                        {file.currentVersion?.originalName ?? "sin archivo"}
                        {file._count.versions > 1 && (
                          <span className="ml-2 inline-flex items-center gap-1 font-sans">
                            <Layers className="size-3" />
                            {file._count.versions}
                          </span>
                        )}
                      </span>
                      {!file.isVisibleToClient && (
                        <span className="text-muted-foreground ml-2 inline-flex items-center gap-1 text-xs">
                          <EyeOff className="size-3" />
                          interno
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell font-normal">
                      {FILE_CATEGORY_LABELS[file.category]}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm md:table-cell font-mono tabular-nums">
                      {formatBytes(file.currentVersion?.sizeBytes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm lg:table-cell font-mono tabular-nums">
                      {formatDate(file.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DownloadButton
                        fileId={file.id}
                        disabled={!file.currentVersion}
                        icon={<Download />}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataState>
    </div>
  );
}
