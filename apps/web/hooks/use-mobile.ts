import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * MODIFICADO respecto a lo que genera shadcn.
 *
 * La version original guardaba el resultado en useState y lo asignaba dentro
 * de un useEffect, lo que provoca un render extra y la regla
 * react-hooks/set-state-in-effect. `useSyncExternalStore` es justo la
 * herramienta para suscribirse a algo externo a React como matchMedia, y su
 * tercer argumento resuelve el renderizado en servidor sin trucos.
 *
 * Si alguna vez se vuelve a ejecutar `shadcn add sidebar`, este fichero se
 * sobrescribira y habra que volver a aplicar este cambio.
 */
function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** En el servidor no hay ventana: se asume escritorio. */
function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
