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
import type { ProjectListItem } from "../types";

export function ProjectsTable({ projects }: { projects: ProjectListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proyecto</TableHead>
            <TableHead className="hidden md:table-cell">Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden lg:table-cell">Avance</TableHead>
            <TableHead className="hidden lg:table-cell">Contenido</TableHead>
            <TableHead className="hidden sm:table-cell">
              Actualizado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Link
                  href={`/proyectos/${project.id}`}
                  className="hover:text-primary block font-medium transition-colors"
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

              <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
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

              <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                {formatDate(project.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="bg-muted h-1.5 w-20 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del proyecto"
      >
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">
        {value}%
      </span>
    </div>
  );
}
