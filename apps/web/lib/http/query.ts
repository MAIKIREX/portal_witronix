/**
 * Construccion de query strings.
 *
 * TRAMPA DEL BACKEND (importante): los DTOs usan `@Type(() => Boolean)` y en
 * JavaScript `Boolean("false") === true`. Es decir, mandar `?unresolved=false`
 * el backend lo lee como `true` y filtra AL REVES, sin dar ningun error.
 *
 * Por eso la regla es: un booleano en `false` se OMITE del query string.
 * Afecta a `unread`, `pending`, `unresolved`, `includeArchived`, `isActive`.
 *
 * Ningun `features/x/api.ts` debe construir query strings a mano.
 */
export function buildParams(
  input: Record<string, unknown>,
): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;

    // Ver comentario de cabecera: `false` se omite, nunca se serializa.
    if (typeof value === "boolean") {
      if (value) params[key] = "true";
      continue;
    }

    params[key] = String(value);
  }

  return params;
}
