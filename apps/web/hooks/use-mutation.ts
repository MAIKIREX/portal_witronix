"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { isApiError, isCanceled, normalizeApiError, type ApiError } from "@/lib/http";

interface UseMutationOptions<TArgs extends unknown[], TResult> {
  onSuccess?: (result: TResult, ...args: TArgs) => void;
  onError?: (error: ApiError) => void;
  /** Aviso de exito. Si es funcion, recibe el resultado. */
  successToast?: string | ((result: TResult) => string);
  /** Aviso de error automatico. Activado por defecto. */
  errorToast?: boolean;
}

/**
 * Escrituras contra la API.
 *
 * Centraliza el try/catch y los avisos para no repetirlos en cada formulario.
 * `mutate` NO relanza el error: devuelve `undefined` si algo falla, de modo que
 * quien llama decide con un simple `if (!result) return;`. El error queda
 * disponible en `error` para pintarlo en linea si hace falta.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: UseMutationOptions<TArgs, TResult> = {},
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fnRef = useRef(fn);
  const optionsRef = useRef(options);

  // Sincronizados en un efecto, no durante el render: escribir en un ref
  // mientras se renderiza rompe con el renderizado concurrente.
  useEffect(() => {
    fnRef.current = fn;
    optionsRef.current = options;
  });

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      const opts = optionsRef.current;
      setIsPending(true);
      setError(null);

      try {
        const result = await fnRef.current(...args);

        if (opts.successToast) {
          sileo.success({
            title:
              typeof opts.successToast === "function"
                ? opts.successToast(result)
                : opts.successToast,
          });
        }
        opts.onSuccess?.(result, ...args);
        return result;
      } catch (caught) {
        if (isCanceled(caught)) return undefined;

        const apiError = isApiError(caught) ? caught : normalizeApiError(caught);
        setError(apiError);

        if (opts.errorToast !== false) {
          sileo.error({
            title: apiError.message,
            // Cuando class-validator devuelve varios errores, el primero ya va
            // en el titulo; el resto se muestra debajo.
            description:
              apiError.messages.length > 1
                ? apiError.messages.slice(1).join(" · ")
                : undefined,
          });
        }
        opts.onError?.(apiError);
        return undefined;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { mutate, isPending, error };
}
