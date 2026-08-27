/** Tipos transversales de la API. Los de dominio viven en types/entities.ts. */

/** Envoltorio de todos los listados paginados del backend. */
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Query base que aceptan todos los listados (PaginationQueryDto del backend). */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Referencia minima a un usuario. El backend la incluye en casi todas las
 * relaciones (`author`, `createdBy`, `uploadedBy`, `actor`...).
 */
export interface UserRef {
  id: string;
  name: string;
  role?: string;
}
