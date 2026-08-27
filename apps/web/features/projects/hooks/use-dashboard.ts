"use client";

import { useApi } from "@/hooks/use-api";
import { projectsApi } from "../api";
import type { DashboardSummary } from "../types";

/** Resumen de la pantalla de inicio. Sin dependencias: se pide una vez. */
export function useDashboard() {
  return useApi<DashboardSummary>(
    (signal) => projectsApi.dashboard(signal),
    [],
  );
}
