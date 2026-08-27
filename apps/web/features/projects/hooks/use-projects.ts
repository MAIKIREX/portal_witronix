"use client";

import type { ProjectStatus } from "@witronix/shared";
import { useApi } from "@/hooks/use-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryParams } from "@/hooks/use-query-params";
import type { Paginated } from "@/types/api";
import { projectsApi } from "../api";
import type { ProjectListItem } from "../types";

/**
 * Valores por defecto del listado. Sirven a la vez para castear lo que llega en
 * la URL y para saber que parametros se pueden omitir de ella.
 */
const DEFAULTS = {
  page: 1,
  q: "",
  status: "" as ProjectStatus | "",
  includeArchived: false,
};

export function useProjects() {
  const { values, setParams, reset } = useQueryParams(DEFAULTS);

  // La busqueda se retrasa antes de convertirse en peticion; la URL, en cambio,
  // se actualiza en cuanto el usuario para de escribir (lo hace el propio input).
  const debouncedQuery = useDebouncedValue(values.q, 400);

  const result = useApi<Paginated<ProjectListItem>>(
    (signal) =>
      projectsApi.list(
        {
          page: values.page,
          q: debouncedQuery || undefined,
          status: values.status || undefined,
          // `false` no se envia: el backend lo interpretaria como true.
          // buildParams se encarga, pero se deja explicito por claridad.
          includeArchived: values.includeArchived || undefined,
        },
        signal,
      ),
    [values.page, debouncedQuery, values.status, values.includeArchived],
    // Al cambiar de pagina se conservan los datos anteriores para no saltar
    // al esqueleto en cada paso.
    { keepPreviousData: true },
  );

  const hasFilters =
    values.q !== "" || values.status !== "" || values.includeArchived;

  return { ...result, values, setParams, reset, hasFilters };
}
