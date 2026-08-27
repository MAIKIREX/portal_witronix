"use client";

// "use client" es obligatorio aqui: este componente pasa `icon={Hammer}` a
// <EmptyState>, que es un Client Component. Un componente es una funcion, y las
// funciones no cruzan la frontera servidor -> cliente. Sin esta directiva Next
// falla en tiempo de ejecucion con "Functions cannot be passed directly to
// Client Components".
import { Hammer } from "lucide-react";
import { EmptyState } from "./states";

/**
 * Marcador para las secciones aun no construidas.
 *
 * Existe porque las pestanas del proyecto y algunos enlaces de los correos que
 * envia el backend ya apuntan a estas rutas: es preferible una pantalla que
 * explique la situacion a un 404.
 */
export function ComingSoon({ section }: { section: string }) {
  return (
    <EmptyState
      icon={Hammer}
      title={`${section} en construccion`}
      description="Esta seccion estara disponible en breve."
    />
  );
}
