"use client";

import Link from "next/link";
import { Archive, Images, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "../types";

export function ProjectsTable({ projects }: { projects: ProjectListItem[] }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-14 font-mono text-[11px] text-muted-foreground/80">
              (#)
            </TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead className="hidden md:table-cell">Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden lg:table-cell">Avance</TableHead>
            <TableHead className="hidden lg:table-cell">Contenido</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              Actualizado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow
              key={project.id}
              className="group border-b border-border/70 hover:bg-[#ecf2f9]/50 transition-colors"
            >
              <TableCell className="w-14 font-mono text-xs text-muted-foreground/50 tabular-nums">
                ({String(index + 1).padStart(2, "0")})
              </TableCell>

              <TableCell>
                <Link
                  href={`/proyectos/${project.id}`}
                  className="group-hover:text-primary block font-medium text-base text-foreground transition-colors"
                >
                  {project.name}
                </Link>
                <span className="text-muted-foreground font-mono text-xs">
                  {project.code}
                </span>
                {project.archivedAt && (
                  <span className="text-muted-foreground ml-2 inline-flex items-center gap-1 text-xs">
                    <Archive className="size-3" />
                    archivado
                  </span>
                )}
              </TableCell>

              <TableCell className="text-muted-foreground hidden text-sm md:table-cell font-normal">
                {project.client.name}
              </TableCell>

              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <ProgressBar value={project.progress} />
              </TableCell>

              <TableCell className="text-muted-foreground hidden lg:table-cell">
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className="inline-flex items-center gap-1"
                    title={`${project._count.renders} renders`}
                  >
                    <Images className="size-3.5" />
                    {project._count.renders}
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    title={`${project._count.comments} comentarios`}
                  >
                    <MessageSquare className="size-3.5" />
                    {project._count.comments}
                  </span>
                </div>
              </TableCell>

              <TableCell className="text-muted-foreground hidden text-sm sm:table-cell text-right font-mono tabular-nums">
                {formatDate(project.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  showLabel = true,
  size = "md",
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const isComplete = clamped === 100;

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-slate-200/90 dark:bg-white/[0.12]",
          size === "sm" ? "h-1.5 w-16" : size === "lg" ? "h-2 w-32" : "h-1.5 w-20 sm:w-24",
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del proyecto"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            isComplete
              ? "bg-emerald-500 dark:bg-emerald-400"
              : "bg-[#00cc99] dark:bg-[#00ffbf]",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {showLabel && (
        <span
          className={cn(
            "font-mono text-xs font-semibold tabular-nums tracking-tight",
            isComplete
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-700 dark:text-slate-200",
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
