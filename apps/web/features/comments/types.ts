import type { TargetType } from "@witronix/shared";
import type { PaginationQuery, UserRef } from "@/types/api";

export interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  /** null en los hilos raiz. Solo se admite un nivel de respuestas. */
  parentId: string | null;
  targetType: TargetType;
  targetId: string;
  /**
   * Coordenadas RELATIVAS al ancho y alto de la imagen, entre 0 y 1.
   * No son pixeles: hay que convertirlas con el tamano mostrado.
   * Son null en los comentarios que no estan anclados a un punto.
   */
  anchorX: number | null;
  anchorY: number | null;
  /** Nota interna del equipo. El backend nunca se los envia a un CLIENT. */
  isInternal: boolean;
  resolvedAt: string | null;
  resolvedById: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: UserRef;
  resolvedBy: UserRef | null;
}

/** Hilo raiz con sus respuestas ya anidadas por el backend. */
export interface CommentThread extends Comment {
  replies: Comment[];
}

export interface CommentQuery extends PaginationQuery {
  targetType?: TargetType;
  targetId?: string;
  /** Solo hilos sin resolver. Recuerda: si es false hay que OMITIRLO. */
  unresolved?: boolean;
}

export interface CreateCommentInput {
  body: string;
  targetType: TargetType;
  targetId: string;
  parentId?: string;
  anchorX?: number;
  anchorY?: number;
  isInternal?: boolean;
}
