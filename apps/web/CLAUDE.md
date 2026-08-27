@AGENTS.md

# Portal Witronix — frontend

Next 16 (Turbopack) + React 19 + Tailwind 4 + shadcn (estilo `base-nova`).
Consume la API NestJS de `apps/api`. Todo en español.

## Regla numero uno: esto es una aplicacion de cliente

El token Bearer vive en el navegador, asi que **el servidor de Next no puede
pedir datos a la API**. Next actua solo como enrutador y empaquetador.

- Las pantallas que consumen la API llevan `'use client'`.
- NO metas fetch de datos en Server Components: no tienen sesion.
- `AuthGuard` es experiencia de usuario, **no seguridad**. El unico guardian
  real es NestJS validando el Bearer en cada peticion.

## Estructura

```
app/         Solo enrutado. Paginas finas: resuelven params, montan una feature
             y ponen los limites de <Suspense>.
features/    Un modulo por dominio: api.ts, types.ts, hooks/, components/
components/  ui/ (shadcn, generado) · layout/ · common/ (compartido)
hooks/       Transversales, sin dominio
lib/         env, format, labels, utils y http/ (capa aislada)
types/       Tipos transversales de la API
```

**Dependencias permitidas:** `app/` → `features/` → `hooks/`, `lib/`, `types/`,
`components/`. Una feature nunca importa de otra feature, salvo de
`features/auth` (sesion y permisos son transversales). Si dos features se
necesitan, se componen en la pagina.

## Capa HTTP (`lib/http/`)

Fuera de esa carpeta **nadie importa axios**. Hay tres clientes:

| Cliente   | Interceptores | Para que |
|-----------|---------------|----------|
| `api`     | Bearer + refresh en 401 | Todo el dominio |
| `rawApi`  | solo normaliza errores  | `/auth/*` que establece sesion |
| `storage` | ninguno                 | PUT del binario a MinIO |

Son tres a proposito: hace **imposible por construccion** el bucle de refresh y
el envio accidental de `Authorization` a MinIO.

`lib/http/refresh.ts` es el punto de mayor riesgo del proyecto. Lee su cabecera
antes de tocarlo.

## Trampas de la API que hay que respetar

1. **`sizeBytes` llega como STRING.** Sumarlo concatena. Usa `formatBytes()`.
2. **Booleanos en la query:** el backend lee `Boolean("false") === true`. Un
   filtro desactivado se **omite**, nunca se envia como `false`. Lo resuelve
   `buildParams()`; no construyas query strings a mano.
3. **`forbidNonWhitelisted`:** un campo de mas en el cuerpo devuelve 400. En un
   PATCH manda solo lo que cambia, nunca la entidad entera.
4. **404 puede significar 403:** el backend no revela si un proyecto existe
   cuando no eres miembro. Los textos no deben afirmar que no existe.
5. **Las URLs firmadas caducan en 300 s.** No las guardes en estado global ni
   las pases por `next/image`: pidelas justo antes de usarlas.
6. **Anclas de comentarios en 0-1**, relativas a la imagen. El contenedor debe
   tener su proporcion EXACTA (ver `AnchoredImageFrame`) o se desplazan.
7. **Botones de aprobacion:** salen de `transicionesPosibles` que devuelve el
   backend. No repliques la maquina de estados.

## Detalles de Next 16

- `middleware.ts` ahora se llama `proxy.ts` (aqui no se usa).
- `params` es una Promise: en cliente, `const { id } = use(props.params)`.
- `PageProps<'/ruta/[param]'>` y `LayoutProps<...>` son globales, sin import.
  Si al anadir una ruta no existen, ejecuta `npx next typegen`.
- Todo componente que use `useSearchParams` va dentro de `<Suspense>`, o
  `next build` falla (en `next dev` no se nota).
- `NEXT_PUBLIC_*` se sustituye en tiempo de build. Se lee solo en `lib/env.ts`.

## shadcn: es Base UI, no Radix

El estilo `base-nova` usa `@base-ui/react`. Cambia respecto a lo habitual:

- No existe `asChild`. Se usa `render={<Link/>}` (+ `nativeButton={false}`
  cuando el elemento resultante no es un `<button>`).
- `DropdownMenuLabel` es un `GroupLabel`: **falla** si no esta dentro de un
  `DropdownMenuGroup`. Para una cabecera informativa usa un `<div>`.
- Las variables de posicion son `--anchor-width`, no `--radix-*`.

Instala los componentes **de uno en uno** y lee lo generado antes de usarlo.
`hooks/use-mobile.ts` esta reescrito con `useSyncExternalStore`: si se
regenera el bloque `sidebar`, hay que volver a aplicarlo.
