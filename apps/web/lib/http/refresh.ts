import { authBridge } from "./auth-bridge";
import { rawApi } from "./raw-client";

/**
 * ============================================================================
 *  REFRESH SERIALIZADO — el punto mas delicado de todo el frontend.
 * ============================================================================
 *
 * El backend rota el refresh token en cada uso Y detecta reuso: si llega un
 * refresh token que ya fue consumido, asume robo, revoca la familia entera y
 * mata la sesion ("Sesion comprometida").
 *
 * Consecuencia: DOS REFRESH CONCURRENTES CON EL MISMO TOKEN CIERRAN LA SESION.
 *
 * Hay tres fuentes de concurrencia, y hacen falta las tres defensas:
 *
 *   1. Varias peticiones fallan con 401 a la vez (lo normal al caducar el
 *      access token) -> lo resuelve la promesa compartida `inflight`.
 *   2. Varias PESTANAS abiertas refrescan a la vez -> lo resuelve
 *      `navigator.locks` (el mutex de modulo solo protege dentro de la pestana).
 *      Este es el bug que solo aparece en produccion.
 *   3. React StrictMode ejecuta los efectos DOS VECES en desarrollo, asi que el
 *      bootstrap de sesion dispararia dos refresh en el primer render y mataria
 *      la sesion en cada recarga -> lo resuelve tambien `inflight`.
 *
 * NO "simplifiques" este fichero quitando el lock o la promesa compartida.
 * El sintoma de romperlo es "se me cierra la sesion sola de vez en cuando",
 * que es dificilisimo de diagnosticar.
 */

export class SessionExpiredError extends Error {
  constructor(public readonly reason: "no-refresh-token" | "refresh-failed") {
    super(`Sesion expirada: ${reason}`);
    this.name = "SessionExpiredError";
  }
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Promesa de refresh en vuelo, compartida por todos los llamantes. */
let inflight: Promise<string> | null = null;

/**
 * Devuelve un access token valido, refrescando si hace falta.
 * Llamadas concurrentes comparten la MISMA promesa: solo se hace un POST.
 */
export function refreshAccessToken(): Promise<string> {
  // La promesa compartida ES la cola. No hace falta un array de callbacks:
  // quien llegue mientras hay un refresh en vuelo se suspende sobre esta misma
  // promesa y se reanuda con el token nuevo.
  if (inflight) return inflight;

  inflight = runRefresh().finally(() => {
    inflight = null;
  });

  return inflight;
}

async function runRefresh(): Promise<string> {
  const exec = async (): Promise<string> => {
    // El refresh token se lee DENTRO del lock, nunca antes de pedirlo.
    // Si otra pestana acabara de rotar mientras esperabamos, aqui leemos el
    // token NUEVO (no consumido). Capturarlo antes de entrar al lock usaria uno
    // ya consumido -> el backend lo detectaria como reuso -> familia revocada.
    // Estas dos lineas son la diferencia entre que funcione y que no.
    const refreshToken = authBridge.getRefreshToken();
    if (!refreshToken) throw new SessionExpiredError("no-refresh-token");

    // Via `rawApi` (sin interceptores) a proposito: si esto responde 401,
    // el error no puede disparar otro refresh. Bucle infinito imposible.
    const { data } = await rawApi.post<RefreshResponse>("/auth/refresh", {
      refreshToken,
    });

    // Persistir el token rotado ANTES de resolver: si el usuario recarga a
    // mitad de camino, en localStorage queda el valido y no el consumido.
    authBridge.setRefreshToken(data.refreshToken);
    authBridge.setAccessToken(data.accessToken);

    return data.accessToken;
  };

  // Web Locks: mutex entre pestanas del mismo origen. Sin esto, dos pestanas
  // abiertas refrescan a la vez con el mismo token y la sesion muere en ambas.
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request("wx-auth-refresh", exec);
  }

  return exec();
}
