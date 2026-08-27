"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Cuenta atras para los limites de peticiones del backend.
 *
 * Varios endpoints de auth estan limitados (login 5/min, forgot-password
 * 3/min) y devuelven 429. Sin esto, el usuario reintenta a ciegas y solo
 * consigue alargar el bloqueo.
 */
export function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const start = useCallback((seconds: number) => {
    setSecondsLeft(seconds);
  }, []);

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
}
