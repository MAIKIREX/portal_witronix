"use client";

import { useEffect } from "react";
import {
  bootstrapSession,
  registerSessionLostHandler,
} from "../session-manager";

/**
 * Arranca la sesion al cargar la aplicacion. No pinta nada.
 *
 * Se monta una sola vez en <Providers>. Tanto `registerSessionLostHandler` como
 * `bootstrapSession` son idempotentes, lo cual importa porque React StrictMode
 * ejecuta este efecto dos veces en desarrollo: sin esa garantia se dispararian
 * dos refresh simultaneos y el backend revocaria la sesion en cada recarga.
 */
export function AuthBootstrap() {
  useEffect(() => {
    registerSessionLostHandler();
    void bootstrapSession();
  }, []);

  return null;
}
