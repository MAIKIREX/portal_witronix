import { create } from "zustand";
import { notificationsApi } from "./api";

/**
 * Contador de notificaciones sin leer, compartido por toda la aplicacion.
 *
 * Por que un store y no `useApi` como el resto: este numero se muestra en la
 * campana de la cabecera Y en la bandeja a la vez, y ambas pueden modificarlo.
 * Con dos instancias independientes de `useApi`, marcar todo como leido desde
 * la bandeja actualizaba su copia pero dejaba la campana con el numero viejo.
 *
 * Es justo el caso que se anuncio en `hooks/use-api.ts`: cuando aparece la
 * necesidad real de compartir estado de servidor, se resuelve en el sitio
 * concreto en lugar de meter una cache global para todo.
 */
interface NotificationState {
  unread: number;
  isLoading: boolean;
  /** Vuelve a consultar el contador al servidor. */
  refresh: () => Promise<void>;
  /** Ajuste optimista, para que el numero baje al instante al abrir una. */
  decrement: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unread: 0,
  isLoading: false,

  refresh: async () => {
    set({ isLoading: true });
    try {
      const unread = await notificationsApi.unreadCount();
      set({ unread });
    } catch {
      // Un fallo al contar no merece molestar al usuario: se reintentara en
      // el siguiente sondeo.
    } finally {
      set({ isLoading: false });
    }
  },

  decrement: () =>
    set((state) => ({ unread: Math.max(0, state.unread - 1) })),

  reset: () => set({ unread: 0 }),
}));
