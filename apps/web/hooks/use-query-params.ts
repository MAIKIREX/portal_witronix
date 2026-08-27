"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ParamValue = string | number | boolean | undefined;

/**
 * Mantiene filtros y paginacion en la URL.
 *
 * Ventajas frente a guardarlos en estado local: los filtros se pueden compartir
 * por enlace y el boton "atras" del navegador funciona solo.
 *
 * AVISO: usa useSearchParams, asi que el componente que llame a este hook DEBE
 * estar dentro de un limite <Suspense> o `next build` falla al prerenderizar
 * (el error no aparece en `next dev`, se descubre tarde).
 */
interface SetParamsOptions {
  /**
   * "push" (por defecto) anade una entrada al historial, asi que el boton
   * atras deshace el cambio de filtro. Usa "replace" para cambios continuos
   * —tipicamente el texto del buscador—: con push, cada pausa al teclear
   * dejaria una entrada y salir de la pantalla costaria diez pulsaciones.
   */
  history?: "push" | "replace";
}

export function useQueryParams<T extends Record<string, ParamValue>>(
  defaults: T,
): {
  values: T;
  setParams: (patch: Partial<T>, options?: SetParamsOptions) => void;
  reset: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // La URL es la fuente de verdad: se castea cada valor segun el tipo del
  // valor por defecto correspondiente.
  const values = useMemo(() => {
    const result = { ...defaults };

    for (const key of Object.keys(defaults) as (keyof T & string)[]) {
      const raw = searchParams.get(key);
      if (raw === null) continue;

      const fallback = defaults[key];
      if (typeof fallback === "number") {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) result[key] = parsed as T[keyof T & string];
      } else if (typeof fallback === "boolean") {
        result[key] = (raw === "true") as T[keyof T & string];
      } else {
        result[key] = raw as T[keyof T & string];
      }
    }

    return result;
    // searchParams es estable por navegacion; defaults se asume constante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setParams = useCallback(
    (patch: Partial<T>, options: SetParamsOptions = {}) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        const fallback = defaults[key as keyof T];

        // Se borran de la URL los valores vacios, los iguales al valor por
        // defecto (para dejarla limpia) y los booleanos en false.
        //
        // Lo de los booleanos no es solo estetico: el backend usa
        // @Type(() => Boolean) y Boolean("false") === true, asi que enviar
        // `?includeArchived=false` filtraria justo al reves, en silencio.
        const shouldRemove =
          value === undefined ||
          value === null ||
          value === "" ||
          value === false ||
          value === fallback;

        if (shouldRemove) next.delete(key);
        else next.set(key, String(value));
      }

      // Cualquier cambio de filtro vuelve a la pagina 1, salvo que el propio
      // cambio sea de pagina. Olvidarlo produce el clasico "no hay resultados"
      // por quedarse en la pagina 7 de un filtro recien aplicado.
      if (!("page" in patch) && "page" in defaults) {
        next.delete("page");
      }

      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      const navigate =
        options.history === "replace" ? router.replace : router.push;
      navigate(url, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname, router],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { values, setParams, reset };
}
