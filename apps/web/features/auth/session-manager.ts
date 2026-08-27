import { authBridge, refreshAccessToken } from "@/lib/http";
import { authApi } from "./api";
import { useSessionStore } from "./store";

/**
 * Arranque y cierre de sesion.
 *
 * Es un modulo, no un hook, porque tiene que poder llamarse desde sitios sin
 * React (el interceptor de axios) y ser idempotente entre renders.
 */

let bootstrapPromise: Promise<void> | null = null;

/**
 * Rehidrata la sesion al cargar la aplicacion.
 *
 * El access token vive solo en memoria, asi que tras un F5 no hay nada: hay que
 * canjear el refresh token de localStorage y volver a pedir el usuario.
 *
 * Es idempotente: React StrictMode ejecuta los efectos dos veces en desarrollo
 * y sin esta guarda se dispararian dos bootstrap (y por tanto dos refresh)
 * en cada recarga.
 */
export function bootstrapSession(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = runBootstrap();
  return bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  const store = useSessionStore.getState();

  // Sin refresh token no hay nada que rehidratar: anonimo, sin tocar la red.
  if (!authBridge.getRefreshToken()) {
    store.clear();
    return;
  }

  try {
    // 1. Canjear el refresh token por un access token nuevo.
    await refreshAccessToken();
    // 2. /auth/refresh NO devuelve el usuario, asi que hay que pedirlo aparte.
    //    Son dos viajes de ida y vuelta por arranque: es el precio de no
    //    persistir la sesion en el navegador.
    const user = await authApi.me();
    store.setSession(user);
  } catch {
    // Token caducado, invalido o familia revocada.
    authBridge.emitSessionLost();
  }
}

/**
 * Conecta la capa HTTP con el store: cuando el interceptor detecta que la
 * sesion ya no vale, el store pasa a `anonymous` y los guards redirigen.
 * Se llama una sola vez, desde <AuthBootstrap>.
 */
export function registerSessionLostHandler(): void {
  authBridge.onSessionLost(() => {
    useSessionStore.getState().clear();
  });
}

/** Cierre de sesion iniciado por el usuario. */
export async function logout(): Promise<void> {
  await authApi.logout();
  // Limpia ambos tokens y avisa al store a traves del handler de arriba.
  authBridge.emitSessionLost();
  // Permite que un login posterior en la misma carga de pagina vuelva a
  // hidratar; sin esto, bootstrapSession() quedaria resuelto para siempre.
  bootstrapPromise = null;
}

/**
 * Marca la sesion como establecida tras un login o al aceptar una invitacion.
 * Los tokens ya los ha guardado `authApi`; esto solo actualiza el store.
 */
export function startSession(user: import("./types").SessionUser): void {
  useSessionStore.getState().setSession(user);
  bootstrapPromise = Promise.resolve();
}
