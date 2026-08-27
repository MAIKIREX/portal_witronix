import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "@/lib/env";
import { authBridge } from "./auth-bridge";
import { normalizeApiError } from "./errors";
import { refreshAccessToken } from "./refresh";

/**
 * Cliente principal: TODO el dominio pasa por aqui.
 *
 * Es el unico de los tres clientes con interceptores. Ningun componente ni hook
 * importa axios directamente; solo los `features/x/api.ts` usan este objeto, y
 * nunca tocan cabeceras ni tokens.
 *
 * Contrato de migracion a BFF: si algun dia los tokens pasan a cookies
 * httpOnly, se cambia la baseURL en lib/env.ts y se vacian refresh.ts y
 * auth-bridge.ts. Los `features/x/api.ts` y las pantallas no se tocan.
 */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});

/**
 * Marcas internas por peticion:
 *  - `_retried`: no reintentar dos veces la misma peticion.
 *  - `_token`: el access token con el que SE ENVIO. Sirve para detectar que
 *    otra peticion ya refresco mientras esta viajaba (ver interceptor abajo).
 */
type RetriableConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _token?: string | null;
};

api.interceptors.request.use((config) => {
  const token = authBridge.getAccessToken();
  (config as RetriableConfig)._token = token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    // Cancelaciones (AbortController de useApi) y fallos de red: pasan tal cual.
    if (axios.isCancel(error) || !error.response || !original) {
      return Promise.reject(normalizeApiError(error));
    }

    if (error.response.status !== 401) {
      return Promise.reject(normalizeApiError(error));
    }

    // Segundo cinturon contra bucles: una peticion se reintenta como mucho una
    // vez. Si vuelve a dar 401 con un token recien renovado, no es que el token
    // este caducado: la sesion ya no vale.
    if (original._retried) {
      authBridge.emitSessionLost();
      return Promise.reject(normalizeApiError(error));
    }
    original._retried = true;

    // Si el access token ya cambio desde que esta peticion salio, es que otra
    // ya refresco mientras viajaba: basta con reintentar con el token actual.
    //
    // Sin esto, las peticiones cuyo 401 llega DESPUES de que el refresh anterior
    // termino (y por tanto ya no encuentran la promesa en vuelo) disparan cada
    // una un refresh extra. No rompe la sesion —cada uno rota el token vigente—
    // pero multiplica las rotaciones sin necesidad, y cuanta menos rotacion haya
    // menos ocasiones tiene la deteccion de reuso de saltar por un mal timing.
    const current = authBridge.getAccessToken();
    if (current && current !== original._token) {
      original.headers.Authorization = `Bearer ${current}`;
      return api(original);
    }

    try {
      // Se une a la promesa en vuelo si otra peticion ya esta refrescando.
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return await api(original);
    } catch {
      // El refresh fallo (token invalido, caducado o familia revocada).
      // emitSessionLost() borra ambos tokens, asi que un refresh posterior
      // falla al instante sin tocar la red: tercera defensa contra bucles.
      authBridge.emitSessionLost();
      return Promise.reject(normalizeApiError(error));
    }
  },
);
