import type { Role } from "@witronix/shared";
import { api, rawApi, authBridge } from "@/lib/http";
import type { InvitationPreview, LoginResult, SessionUser } from "./types";

/**
 * Llamadas de autenticacion.
 *
 * Nota sobre que cliente usa cada una:
 *  - `rawApi` (sin interceptores) para login y aceptar invitacion: son las que
 *    ESTABLECEN la sesion, no la consumen. No deben reintentarse ni disparar
 *    un refresh si fallan con 401 (un 401 aqui significa "credenciales malas",
 *    no "token caducado").
 *  - `api` para el resto, que si necesitan Bearer.
 */

/** Guarda los tokens recien emitidos. Punto unico para no olvidarse de ninguno. */
function storeTokens(result: LoginResult): LoginResult {
  authBridge.setAccessToken(result.accessToken);
  authBridge.setRefreshToken(result.refreshToken);
  return result;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const { data } = await rawApi.post<LoginResult>("/auth/login", {
      email,
      password,
    });
    return storeTokens(data);
  },

  async me(): Promise<SessionUser> {
    const { data } = await api.get<SessionUser>("/auth/me");
    return data;
  },

  /**
   * Cierra la sesion actual. Es endpoint publico: solo necesita el refresh
   * token, no el Bearer. Nunca lanza: si falla en el servidor, en el cliente
   * la sesion se cierra igualmente.
   */
  async logout(): Promise<void> {
    const refreshToken = authBridge.getRefreshToken();
    if (refreshToken) {
      try {
        await rawApi.post("/auth/logout", { refreshToken });
      } catch {
        // Da igual: lo importante es limpiar en local, y de eso se encarga
        // quien llama (el store). Un logout que falla no debe atrapar al
        // usuario dentro de la aplicacion.
      }
    }
  },

  /** Cierra la sesion en todos los dispositivos. Requiere Bearer. */
  async logoutAll(): Promise<void> {
    await api.post("/auth/logout-all");
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },

  /**
   * Crea una invitacion y dispara el correo. Solo ADMIN y PROJECT_MANAGER.
   * `clientId` es obligatorio cuando el rol es CLIENT.
   */
  async createInvitation(input: {
    email: string;
    name: string;
    role: Role;
    clientId?: string;
  }): Promise<{ id: string; email: string; expiresAt: string }> {
    const { data } = await api.post<{
      id: string;
      email: string;
      expiresAt: string;
    }>("/auth/invitations", input);
    return data;
  },

  /** Datos de la invitacion para precargar el formulario. Endpoint publico. */
  async getInvitation(token: string): Promise<InvitationPreview> {
    const { data } = await rawApi.get<InvitationPreview>(
      `/auth/invitations/${token}`,
    );
    return data;
  },

  /** Al aceptar, el backend devuelve una sesion completa: se entra directo. */
  async acceptInvitation(
    token: string,
    password: string,
  ): Promise<LoginResult> {
    const { data } = await rawApi.post<LoginResult>(
      `/auth/invitations/${token}/accept`,
      { password },
    );
    return storeTokens(data);
  },

  /**
   * Siempre responde 202, exista o no la cuenta (anti-enumeracion).
   * La UI debe mostrar el mismo mensaje en ambos casos.
   */
  async forgotPassword(email: string): Promise<void> {
    await rawApi.post("/auth/forgot-password", { email });
  },

  /**
   * No hay endpoint para validar el token antes de enviar: si es invalido o
   * caducado, se descubre aqui con un 400.
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await rawApi.post("/auth/reset-password", { token, password });
  },
};
