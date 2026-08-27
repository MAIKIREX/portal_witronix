import { api, buildParams } from "@/lib/http";
import type { Paginated } from "@/types/api";
import type { Comment, CommentQuery, CommentThread, CreateCommentInput } from "./types";

export const commentsApi = {
  /** Devuelve solo los hilos raiz; las respuestas vienen anidadas en `replies`. */
  list(
    projectId: string,
    query: CommentQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<CommentThread>> {
    return api
      .get<Paginated<CommentThread>>(`/projects/${projectId}/comments`, {
        params: buildParams({ ...query }),
        signal,
      })
      .then((r) => r.data);
  },

  create(projectId: string, input: CreateCommentInput): Promise<Comment> {
    return api
      .post<Comment>(`/projects/${projectId}/comments`, input)
      .then((r) => r.data);
  },

  /** Solo el autor puede editar; el backend responde 403 en caso contrario. */
  update(commentId: string, body: string): Promise<Comment> {
    return api
      .patch<Comment>(`/comments/${commentId}`, { body })
      .then((r) => r.data);
  },

  resolve(commentId: string): Promise<Comment> {
    return api
      .post<Comment>(`/comments/${commentId}/resolve`)
      .then((r) => r.data);
  },

  reopen(commentId: string): Promise<Comment> {
    return api
      .post<Comment>(`/comments/${commentId}/reopen`)
      .then((r) => r.data);
  },

  remove(commentId: string): Promise<void> {
    return api.delete(`/comments/${commentId}`).then(() => undefined);
  },
};
