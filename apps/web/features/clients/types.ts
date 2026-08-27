import type { PaginationQuery } from "@/types/api";

export interface Client {
  id: string;
  name: string;
  taxId: string | null;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Detalle: incluye usuarios y proyectos no archivados. */
export interface ClientDetail extends Client {
  users: { id: string; name: string; email: string; isActive: boolean }[];
  projects: {
    id: string;
    code: string;
    name: string;
    status: string;
    progress: number;
    updatedAt: string;
  }[];
}

export interface ClientQuery extends PaginationQuery {
  /** Si es false hay que OMITIRLO: el backend lo leeria como true. */
  isActive?: boolean;
}

export interface CreateClientInput {
  name: string;
  taxId?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  isActive?: boolean;
}
