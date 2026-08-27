/**
 * Capa HTTP aislada.
 *
 * Regla del proyecto: fuera de esta carpeta nadie importa `axios`.
 * Los `features/x/api.ts` importan `api` (o `storage` para subidas) desde aqui.
 */

export { api } from "./api-client";
export { rawApi } from "./raw-client";
export { storage } from "./storage-client";
export { authBridge } from "./auth-bridge";
export { refreshAccessToken, SessionExpiredError } from "./refresh";
export { buildParams } from "./query";
export {
  normalizeApiError,
  isApiError,
  isCanceled,
  type ApiError,
  type ApiErrorKind,
} from "./errors";
