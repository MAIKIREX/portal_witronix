"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Migas de pan.
 *
 * Los segmentos estaticos se traducen con el mapa de abajo, pero los dinamicos
 * (`/proyectos/[id]`) no se pueden etiquetar desde la ruta: haria falta el
 * nombre del proyecto, que solo conoce la pantalla que lo ha cargado.
 * Por eso una pagina puede sustituir las migas con `useSetBreadcrumbs`, en
 * lugar de que este componente vuelva a pedir el dato a la API.
 */
const STATIC_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  proyectos: "Proyectos",
  renders: "Renders",
  comentarios: "Comentarios",
  aprobaciones: "Aprobaciones",
  archivos: "Documentos",
  notificaciones: "Notificaciones",
  clientes: "Clientes",
  perfil: "Mi cuenta",
};

const BreadcrumbContext = createContext<{
  crumbs: Crumb[] | null;
  setCrumbs: (crumbs: Crumb[] | null) => void;
}>({ crumbs: null, setCrumbs: () => {} });

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null);
  const value = useMemo(() => ({ crumbs, setCrumbs }), [crumbs]);
  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/** Permite a una pantalla poner migas con datos reales (nombre del proyecto). */
export function useSetBreadcrumbs() {
  return useContext(BreadcrumbContext).setCrumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { crumbs: override } = useContext(BreadcrumbContext);

  const crumbs = useMemo<Crumb[]>(() => {
    if (override) return override;

    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;
      return {
        // Un segmento desconocido suele ser un identificador: se muestra
        // abreviado en vez de volcar un UUID entero en la cabecera.
        label: STATIC_LABELS[segment] ?? shorten(segment),
        href: isLast ? undefined : href,
      };
    });
  }, [pathname, override]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegacion" className="min-w-0">
      <ol className="text-muted-foreground flex items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground truncate transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground truncate font-medium">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function shorten(segment: string): string {
  return segment.length > 12 ? `${segment.slice(0, 8)}…` : segment;
}
