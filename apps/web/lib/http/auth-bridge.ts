import { REFRESH_TOKEN_KEY } from "@/lib/env";

/**
 * Puente entre la capa HTTP y el store de sesion.
 *
 * Existe para romper una dependencia circular: el interceptor de axios necesita
 * el access token, y el store de sesion necesita llamar a la API. Si se
 * importaran entre si, tendriamos un ciclo. Este modulo NO importa nada salvo
 * la constante de la clave de localStorage, asi que ambos lados pueden
 * depender de el sin ciclo.
 *
 * Donde vive cada token y por que:
 *  - access token  -> variable de modulo (memoria). Dura 15 min. Meterlo en
 *    localStorage seria superficie XSS gratis sin ganar nada: se regenera solo.
 *  - refresh token -> localStorage. Tiene que sobrevivir a un F5, no hay
 *    alternativa sin cookies httpOnly (que requeriria un BFF).
 */

let accessToken: string | null = null;
let sessionLostHandler: (() => void) | null = null;

export const authBridge = {
  getAccessToken: (): string | null => accessToken,

  setAccessToken: (token: string | null): void => {
    accessToken = token;
  },

  getRefreshToken: (): string | null => {
    // Guardia de SSR: este modulo se puede importar desde un arbol que Next
    // renderiza en servidor aunque los datos solo se pidan en cliente.
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string | null): void => {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  /** El store de sesion se registra aqui al arrancar la app. */
  onSessionLost: (handler: (() => void) | null): void => {
    sessionLostHandler = handler;
  },

  /**
   * UNICO camino a "sesion muerta". Limpia ambos tokens y avisa al store,
   * que a su vez hace que el AuthGuard redirija a /login.
   */
  emitSessionLost: (): void => {
    accessToken = null;
    authBridge.setRefreshToken(null);
    sessionLostHandler?.();
  },
};
