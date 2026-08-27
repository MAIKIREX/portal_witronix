"use client";

import { useEffect, useState } from "react";

/**
 * Retrasa la propagacion de un valor que cambia rapido (tipico: un buscador).
 * Sin esto, escribir en el filtro genera una entrada de historial y una
 * peticion por cada tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
