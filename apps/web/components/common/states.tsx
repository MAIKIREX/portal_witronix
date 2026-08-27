"use client";

import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/http";

/** Sin resultados. No es un error: no debe parecerlo. */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <Icon className="text-muted-foreground size-6" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-sm text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-12 text-center"
    >
      <AlertCircle className="text-destructive size-6" />
      <div className="space-y-1">
        <p className="font-medium">{titleFor(error)}</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          {error.message}
        </p>
      </div>
      {onRetry && error.kind !== "forbidden" && error.kind !== "not-found" && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Reintentar
        </Button>
      )}
    </div>
  );
}

function titleFor(error: ApiError): string {
  switch (error.kind) {
    case "network":
      return "Sin conexion con el servidor";
    case "forbidden":
      return "No tienes permisos";
    // El backend responde 404 tambien cuando el recurso existe pero el usuario
    // no es miembro del proyecto: no filtra su existencia a proposito. Por eso
    // el titulo no afirma que no exista.
    case "not-found":
      return "No disponible";
    case "rate-limit":
      return "Demasiadas peticiones";
    case "server":
      return "Error del servidor";
    default:
      return "No se han podido cargar los datos";
  }
}

/**
 * Reparte entre cargando / error / vacio / contenido.
 *
 * Evita repetir la misma escalera de condiciones en cada pantalla y, sobre todo,
 * evita olvidarse del estado vacio, que es el que mas se olvida.
 */
export function DataState<T>({
  isLoading,
  error,
  data,
  onRetry,
  skeleton,
  empty,
  isEmpty,
  children,
}: {
  isLoading: boolean;
  error: ApiError | null;
  data: T | null;
  onRetry?: () => void;
  skeleton: React.ReactNode;
  empty?: React.ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}) {
  if (isLoading && data === null) return <>{skeleton}</>;
  if (error && data === null) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  if (data === null) return <>{skeleton}</>;
  if (empty && isEmpty?.(data)) return <>{empty}</>;
  return <>{children(data)}</>;
}
