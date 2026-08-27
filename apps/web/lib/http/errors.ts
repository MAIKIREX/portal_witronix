import axios, { AxiosError } from "axios";

/**
 * Normalizacion de errores.
 *
 * Regla del proyecto: de la capa HTTP hacia arriba SOLO sale `ApiError`.
 * Ningun componente ni hook debe importar tipos de axios ni inspeccionar
 * `error.response`. Si necesitas un caso nuevo, se anade aqui.
 */

export type ApiErrorKind =
  | "network" // sin respuesta del servidor (offline, DNS, timeout)
  | "canceled" // AbortController / cancelacion. NO es un fallo: no mostrar toast.
  | "validation" // 400 de class-validator
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not-found" // 404 (ojo: el backend devuelve 404 tambien por falta de acceso)
  | "conflict" // 409
  | "rate-limit" // 429
  | "server" // 5xx
  | "unknown";

export interface ApiError {
  /** 0 cuando no hubo respuesta (red o cancelacion). */
  status: number;
  /** Mensaje ya listo para mostrar al usuario. */
  message: string;
  /** Lista completa cuando el backend devuelve un array de class-validator. */
  messages: string[];
  kind: ApiErrorKind;
  raw?: unknown;
}

/** Forma exacta del JSON de error del backend (all-exceptions.filter.ts). */
interface BackendErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate-limit";
  if (status >= 500) return "server";
  return "unknown";
}

const FALLBACK_BY_KIND: Record<ApiErrorKind, string> = {
  network:
    "No se pudo conectar con el servidor. Comprueba tu conexion e intentalo de nuevo.",
  canceled: "Peticion cancelada.",
  validation: "Los datos enviados no son validos.",
  unauthorized: "Tu sesion ha caducado. Vuelve a iniciar sesion.",
  forbidden: "No tienes permisos para hacer esto.",
  // El backend devuelve 404 tambien cuando el recurso existe pero no eres
  // miembro del proyecto (decision de seguridad deliberada: no filtra su
  // existencia). Por eso el copy no afirma que no exista.
  "not-found": "No se ha encontrado el recurso, o no tienes acceso a el.",
  conflict: "Ya existe un registro con esos datos.",
  "rate-limit": "Demasiados intentos. Espera un momento antes de reintentar.",
  server: "Error del servidor. Intentalo de nuevo en unos minutos.",
  unknown: "Ha ocurrido un error inesperado.",
};

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return {
      status: 0,
      kind: "canceled",
      message: FALLBACK_BY_KIND.canceled,
      messages: [],
      raw: error,
    };
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<BackendErrorBody>;

    // Sin respuesta: red caida, CORS, o timeout.
    if (!axiosError.response) {
      const isTimeout = axiosError.code === "ECONNABORTED";
      return {
        status: 0,
        kind: "network",
        message: isTimeout
          ? "El servidor ha tardado demasiado en responder."
          : FALLBACK_BY_KIND.network,
        messages: [],
        raw: error,
      };
    }

    const status = axiosError.response.status;
    const kind = kindFromStatus(status);
    const body = axiosError.response.data;

    // `message` puede ser string o string[] (class-validator).
    const messages: string[] = Array.isArray(body?.message)
      ? body.message.filter((m): m is string => typeof m === "string")
      : typeof body?.message === "string"
        ? [body.message]
        : [];

    return {
      status,
      kind,
      message: messages[0] ?? FALLBACK_BY_KIND[kind],
      messages,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      kind: "unknown",
      message: error.message || FALLBACK_BY_KIND.unknown,
      messages: [],
      raw: error,
    };
  }

  return {
    status: 0,
    kind: "unknown",
    message: FALLBACK_BY_KIND.unknown,
    messages: [],
    raw: error,
  };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "status" in value &&
    "messages" in value
  );
}

/** Una cancelacion no es un fallo real: no debe pintar error ni lanzar toast. */
export function isCanceled(value: unknown): boolean {
  return isApiError(value) && value.kind === "canceled";
}
