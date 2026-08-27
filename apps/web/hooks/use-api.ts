"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isApiError, isCanceled, normalizeApiError, type ApiError } from "@/lib/http";

export interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  /** Primera carga: todavia no hay datos que mostrar. */
  isLoading: boolean;
  /** Recarga con datos previos ya en pantalla (paginacion, filtros). */
  isValidating: boolean;
  refetch: () => Promise<void>;
  /** Actualizacion local, para respuestas optimistas. */
  setData: (updater: T | ((prev: T | null) => T)) => void;
}

interface UseApiOptions<T> {
  /** Para dependencias aun no resueltas (ej. esperar a tener el projectId). */
  enabled?: boolean;
  /** Mantiene los datos anteriores mientras recarga: evita el salto a esqueleto. */
  keepPreviousData?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Lectura de datos de la API.
 *
 * Deliberadamente SIN cache global, deduplicacion ni revalidacion al enfocar.
 * Si algun dia hace falta compartir cache entre componentes, esa sera la senal
 * para meter SWR o TanStack Query, y tenerlo centralizado aqui hace que sea un
 * cambio localizado. No lo construyamos ahora "por si acaso".
 *
 * Para evitar pedir el mismo recurso desde varios sitios, la pauta es cargarlo
 * una vez en el layout del segmento y repartirlo por contexto.
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  options: UseApiOptions<T> = {},
): UseApiResult<T> {
  const { enabled = true, keepPreviousData = false } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoadingState, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // El fetcher va en un ref y NO entra en las dependencias del efecto.
  // Si dependieramos de el, cada render crearia una funcion nueva, el efecto
  // se relanzaria y entrariamos en un bucle infinito de peticiones. Es el fallo
  // numero uno de los useApi caseros: las dependencias son el array `deps`
  // explicito que pasa quien llama.
  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);

  // Los refs se sincronizan en un efecto, NO durante el render: escribirlos
  // mientras se renderiza rompe con el renderizado concurrente.
  // Este efecto se declara ANTES que el de carga a proposito: los efectos se
  // ejecutan en orden de declaracion, asi que cuando el de abajo lance la
  // peticion los refs ya tendran los valores de este render.
  useEffect(() => {
    fetcherRef.current = fetcher;
    optionsRef.current = options;
  });

  // Solo se aplica la respuesta de la ULTIMA peticion lanzada. Abortar no basta:
  // al teclear en un buscador, una respuesta antigua puede llegar despues de
  // una nueva y pisarla.
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const execute = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    if (hasDataRef.current && keepPreviousData) setIsValidating(true);
    else setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current(controller.signal);
      if (requestId !== requestIdRef.current) return; // llego tarde: se descarta
      hasDataRef.current = true;
      setDataState(result);
      optionsRef.current.onSuccess?.(result);
    } catch (caught) {
      if (requestId !== requestIdRef.current) return;
      // Una cancelacion no es un fallo: no debe pintar error ni lanzar aviso.
      if (isCanceled(caught)) return;

      const apiError = isApiError(caught)
        ? caught
        : normalizeApiError(caught);
      setError(apiError);
      if (!keepPreviousData) {
        setDataState(null);
        hasDataRef.current = false;
      }
      optionsRef.current.onError?.(apiError);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [keepPreviousData]);

  useEffect(() => {
    // Sin `setIsLoading(false)` aqui: cambiar el estado de forma sincrona
    // dentro de un efecto encadena renders. Se deriva mas abajo.
    if (!enabled) return;
    // `execute` marca el estado de carga antes de su primer await, y la regla
    // lo detecta como setState dentro de un efecto. Aqui es inevitable y
    // deseado: pedir datos desde un efecto exige senalar que se esta cargando,
    // y ese render extra es justamente lo que pinta el esqueleto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void execute();
    return () => controllerRef.current?.abort();
    // `deps` es intencionadamente dinamico: es el contrato del hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute, ...deps]);

  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setDataState((prev) =>
      typeof updater === "function"
        ? (updater as (p: T | null) => T)(prev)
        : updater,
    );
    hasDataRef.current = true;
  }, []);

  return {
    data,
    error,
    // Derivado en lugar de asignado: mientras el hook este deshabilitado no
    // esta cargando nada, sea cual sea el estado interno.
    isLoading: enabled && isLoadingState,
    isValidating,
    refetch: execute,
    setData,
  };
}
