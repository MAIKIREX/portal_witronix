/**
 * Unico punto de lectura de variables de entorno del cliente.
 *
 * IMPORTANTE: las variables NEXT_PUBLIC_* se sustituyen literalmente en tiempo de
 * build, no en runtime. Next hace la sustitucion buscando el texto exacto
 * `process.env.NEXT_PUBLIC_X`, asi que NO se puede desestructurar ni indexar
 * dinamicamente (`const e = process.env; e.NEXT_PUBLIC_X` NO se sustituye).
 * Por eso se leen aqui de forma literal y el resto de la app importa la constante.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/** Clave de localStorage donde vive el refresh token. Solo la usa lib/http/auth-bridge. */
export const REFRESH_TOKEN_KEY = "wx.rt";
