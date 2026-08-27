import { create } from "zustand";
import type { SessionUser } from "./types";

/**
 * Estado de sesion.
 *
 * `hydrating` es el estado INICIAL a proposito (no `anonymous`): al arrancar
 * todavia no sabemos si hay sesion, porque hay que canjear el refresh token.
 * Si el inicial fuera `anonymous`, los guards redirigirian a /login durante un
 * instante en cada recarga.
 */
export type SessionStatus = "hydrating" | "authenticated" | "anonymous";

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  setSession: (user: SessionUser) => void;
  clear: () => void;
}

/**
 * NO se usa el middleware `persist` de zustand, a proposito:
 *
 *  - El access token vive en memoria (lib/http/auth-bridge). Dura 15 min y se
 *    regenera solo: meterlo en localStorage seria superficie XSS a cambio de
 *    nada.
 *  - El refresh token vive en localStorage, pero lo gestiona `authBridge`, no
 *    este store.
 *  - El `user` se recupera con GET /auth/me en cada arranque. Persistirlo
 *    tentaria a pintar la interfaz con un rol obsoleto antes de validar nada;
 *    asi el rol que decide que ve el usuario siempre viene recien validado.
 */
export const useSessionStore = create<SessionState>((set) => ({
  status: "hydrating",
  user: null,
  setSession: (user) => set({ status: "authenticated", user }),
  clear: () => set({ status: "anonymous", user: null }),
}));
