import type { NotificationType, TargetType } from "@witronix/shared";
import type { PaginationQuery } from "@/types/api";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /**
   * Ruta INTERNA del portal, generada por el backend. Ya viene con la forma
   * `/proyectos/{id}/...`, asi que se usa tal cual con <Link>.
   * Puede apuntar a algo que ya no existe (un render borrado, por ejemplo).
   */
  link: string | null;
  projectId: string | null;
  targetType: TargetType | null;
  targetId: string | null;
  readAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

export interface NotificationQuery extends PaginationQuery {
  /** Solo las no leidas. Si es false, hay que OMITIRLO. */
  unread?: boolean;
}
