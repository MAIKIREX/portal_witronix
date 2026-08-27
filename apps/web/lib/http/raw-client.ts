import axios from "axios";
import { API_URL } from "@/lib/env";
import { normalizeApiError } from "./errors";

/**
 * Cliente para los endpoints que ESTABLECEN la sesion en lugar de consumirla:
 * `/auth/login`, `/auth/refresh`, `/auth/logout`, invitaciones y recuperacion
 * de contrasena.
 *
 * NO LLEVA cabecera Authorization ni logica de reintento/refresh, a proposito:
 * si `/auth/refresh` responde 401, ese error no puede disparar otro refresh,
 * asi que el bucle infinito es imposible por construccion y no depende de que
 * nadie se acuerde de poner un flag.
 *
 * Lo unico que si lleva es un interceptor de NORMALIZACION DE ERRORES. No
 * reintenta ni toca tokens: solo convierte el AxiosError en `ApiError`, igual
 * que hace `api`. Sin esto, los formularios de auth reciben AxiosError crudos,
 * `isApiError()` devuelve false y siempre acaban mostrando el mensaje generico
 * en vez del que envia el backend.
 */
export const rawApi = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

rawApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);
