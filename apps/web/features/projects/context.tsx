"use client";

import { createContext, useContext } from "react";
import type { ApiError } from "@/lib/http";
import type { ProjectDetail } from "./types";

/**
 * Comparte el proyecto cargado con todas las pantallas del segmento.
 *
 * El proyecto se pide UNA sola vez, en el layout de /proyectos/[id], y se
 * reparte por aqui. Como `useApi` no tiene cache global ni deduplicacion, sin
 * este contexto cada pestana (resumen, renders, comentarios, aprobaciones)
 * volveria a pedir el mismo proyecto al montarse.
 */
interface ProjectContextValue {
  project: ProjectDetail;
  /** Vuelve a pedir el proyecto: tras cambiar estado o avance. */
  refetch: () => Promise<void>;
  /** Actualizacion local optimista, sin ir a la red. */
  setProject: (project: ProjectDetail) => void;
  error: ApiError | null;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  value,
  children,
}: {
  value: ProjectContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error(
      "useProject() fuera de <ProjectProvider>: usalo dentro de /proyectos/[id].",
    );
  }
  return context;
}
