"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectStatus } from "@witronix/shared";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { usePermissions } from "@/features/auth/hooks/use-permissions";

/** Base UI usa `items` para poder mostrar la etiqueta del valor seleccionado. */
const STATUS_ITEMS = [
  { value: "", label: "Todos los estados" },
  ...Object.values(ProjectStatus).map((status) => ({
    value: status,
    label: PROJECT_STATUS_LABELS[status],
  })),
];

export function ProjectFiltersBar({
  values,
  setParams,
  reset,
  hasFilters,
}: {
  values: { q: string; status: ProjectStatus | ""; includeArchived: boolean };
  setParams: (
    patch: Partial<{
      q: string;
      status: ProjectStatus | "";
      includeArchived: boolean;
      page: number;
    }>,
    options?: { history?: "push" | "replace" },
  ) => void;
  reset: () => void;
  hasFilters: boolean;
}) {
  const { isStaff } = usePermissions();

  // El input se controla en local y se vuelca a la URL con retardo: escribir en
  // el buscador no debe generar una entrada de historial por cada tecla.
  const [query, setQuery] = useState(values.q);

  // Ultimo valor que ESTE campo mando a la URL. Sirve para distinguir un
  // cambio propio de uno ajeno (ver el segundo efecto).
  const lastPushed = useRef(values.q);

  useEffect(() => {
    if (query === values.q) return;
    // "replace" a proposito: el texto cambia de forma continua y con push cada
    // pausa al teclear dejaria una entrada en el historial.
    const id = setTimeout(() => {
      lastPushed.current = query;
      setParams({ q: query }, { history: "replace" });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Sincroniza el input cuando la URL cambia por algo AJENO a este campo:
  // el boton de limpiar, el atras del navegador o un enlace compartido.
  //
  // La comparacion con `lastPushed` no es opcional: sin ella, el valor que
  // acabamos de enviar vuelve por la URL y pisa lo que el usuario sigue
  // escribiendo, perdiendo las ultimas letras.
  useEffect(() => {
    if (values.q === lastPushed.current) return;
    lastPushed.current = values.q;
    setQuery(values.q);
  }, [values.q]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o codigo…"
          aria-label="Buscar proyectos"
          className="pl-8"
        />
      </div>

      <Select
        items={STATUS_ITEMS}
        value={values.status}
        onValueChange={(value) =>
          setParams({ status: (value ?? "") as ProjectStatus | "" })
        }
      >
        <SelectTrigger className="w-52" aria-label="Filtrar por estado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ITEMS.map((item) => (
            <SelectItem key={item.value || "todos"} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Los clientes no ven proyectos archivados, asi que el conmutador solo
          tiene sentido para el equipo interno. */}
      {isStaff && (
        <Button
          variant={values.includeArchived ? "secondary" : "outline"}
          onClick={() =>
            setParams({ includeArchived: !values.includeArchived })
          }
          aria-pressed={values.includeArchived}
        >
          Incluir archivados
        </Button>
      )}

      {hasFilters && (
        <Button variant="ghost" onClick={reset}>
          <X />
          Limpiar
        </Button>
      )}
    </div>
  );
}
