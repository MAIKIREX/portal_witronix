# Portal Witronix

Portal privado de gestión de proyectos de iluminación, domótica e inmótica.

Monorepo pnpm:

| Paquete | Ruta | Estado |
|---|---|---|
| `@witronix/api` | `apps/api` | NestJS 11 + Prisma — **en desarrollo** |
| `@witronix/web` | `apps/web` | Next.js 16 — pendiente (fase siguiente) |
| `@witronix/shared` | `packages/shared` | Enums y validaciones compartidas |

La web comercial pública (Astro) vive aparte, en `D:\witronix\witronix-page\Pagina-witronix-26`, y no forma parte de este monorepo.

---

## Requisitos

- Node.js >= 22.12 (probado con 24.18)
- pnpm 11 (`npm install -g pnpm`)
- Docker Desktop

## Arranque

```bash
pnpm install
cp .env.example .env
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm dev:api
```

## Servicios locales

| Servicio | URL | Notas |
|---|---|---|
| API | http://localhost:3001/api/v1 | |
| Swagger | http://localhost:3001/api/v1/docs | Solo fuera de producción |
| Health | http://localhost:3001/api/v1/health | Debe devolver `db: ok, storage: ok` |
| PostgreSQL | `localhost:5433` | **5433, no 5432** — ver nota abajo |
| MinIO (S3) | http://localhost:9000 | |
| MinIO consola | http://localhost:9001 | usuario/clave: `witronix` / `witronix_dev_secret` |
| Mailpit | http://localhost:8025 | Captura todos los emails en local |

## Usuarios de ejemplo

Contraseña común: `Witronix2026!`

| Email | Rol | Acceso |
|---|---|---|
| `admin@witronixled.com` | ADMIN | todo |
| `pm@witronixled.com` | PROJECT_MANAGER | los 3 proyectos |
| `tecnico@witronixled.com` | TECHNICIAN | proyectos 001 y 003 |
| `cliente@constructoraxyz.bo` | CLIENT | solo PRY-2026-001 y 002 |
| `cliente@hotelcentral.bo` | CLIENT | solo PRY-2026-003 |

Los dos clientes existen a propósito para poder verificar que uno **no** puede leer los proyectos del otro.

---

## Notas de este entorno

Tres cosas no evidentes, documentadas para no volver a tropezar con ellas:

**PostgreSQL en el puerto 5433.** Esta máquina ya tiene un PostgreSQL 18 instalado como servicio de Windows (`postgresql-x64-18`) ocupando el 5432, y era él quien respondía a las conexiones en lugar del contenedor — con un error de autenticación desconcertante. El contenedor usa 5433 para convivir sin tocar esa instalación.

**CORS de MinIO va por variable de entorno, no por bucket.** MinIO no implementa la API `PutBucketCors` de S3: `mc cors set` responde *"functionality is not implemented"*. Se configura con `MINIO_API_CORS_ALLOW_ORIGIN` sobre el servicio `minio` en `docker-compose.yml`. Sin esto, la subida directa del navegador a las presigned URLs falla.

Para comprobar que sigue bien:

```bash
curl -i -X OPTIONS "http://localhost:9000/witronix-portal/x.jpg" -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: PUT"
```

Debe devolver `Access-Control-Allow-Origin: http://localhost:3000`.

**pnpm bloquea los scripts de postinstall.** Prisma, `argon2` y `sharp` los necesitan para sus binarios nativos; están aprobados en `onlyBuiltDependencies` dentro de `pnpm-workspace.yaml` (en pnpm 11 ese ajuste ya no va en `package.json`).

**Los UUID del seed son legibles pero conformes a RFC 4122.** Se ven como `11111111-1111-4111-8111-111111111111`: el tercer grupo empieza por `4` (versión) y el cuarto por `8` (variante). Un `11111111-1111-1111-1111-111111111111` es aceptado por PostgreSQL como tipo `uuid` pero **no es un UUID válido**, y `class-validator` lo rechaza — con un error que apunta al DTO en lugar de al dato. Si añades más datos de ejemplo, respeta ese patrón.

---

## Scripts

```bash
pnpm infra:up        # levanta postgres + minio + mailpit
pnpm infra:down      # los para
pnpm infra:reset     # los borra CON SUS DATOS y vuelve a levantar
pnpm infra:logs      # logs en vivo

pnpm db:migrate      # aplica migraciones
pnpm db:seed         # datos de ejemplo (idempotente)
pnpm db:studio       # explorador visual de la base de datos
pnpm db:reset        # BORRA la base de datos y la reconstruye

pnpm dev:api         # API en modo watch
pnpm build           # compila todos los paquetes
```

## Estructura del backend

```
apps/api/
├── prisma/
│   ├── schema.prisma     # 16 tablas, 9 enums
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── config/           # validación del entorno con Zod al arrancar
    ├── prisma/           # PrismaService
    ├── common/           # guards, decoradores, filtros, DTOs, utilidades de token
    └── modules/
        ├── auth/           # login, refresh, invitaciones, reset de contraseña
        ├── clients/        # CRUD de empresas cliente
        ├── projects/       # CRUD, estado, avance, miembros, dashboard
        ├── files/          # documentos con versionado
        ├── renders/        # renders con versionado y miniaturas
        ├── comments/       # hilos y anotaciones sobre renders
        ├── approvals/      # máquina de estados + historial
        ├── notifications/  # in-app y email, por eventos de dominio
        ├── activity/       # línea de tiempo del proyecto
        ├── health/
        ├── mail/           # nodemailer → Mailpit en local
        └── storage/        # StorageService (abstracción sobre S3/MinIO)
```

### Subida de archivos: tres pasos

El binario **nunca atraviesa la API**. Un render de 40 MB pasando por Node sería el primer cuello de botella del portal.

```
1. POST .../renders            → NestJS valida permisos, tipo y tamaño
                                 y devuelve una URL firmada
2. PUT  <url firmada>          → el navegador sube DIRECTO a MinIO
3. POST .../versions/:id/confirm → NestJS lee los metadatos reales del
                                 objeto y publica la versión
```

Dos detalles que hacen falta para que esto sea sólido:

- **`uploadStatus`**: la fila se crea en `PENDING` antes de que exista el objeto. Si la subida se abandona, un job la purga cada hora junto con el objeto huérfano. Sin esto quedarían versiones fantasma que rompen la numeración.
- **Se releen los metadatos al confirmar**: el tamaño y el tipo que declara el navegador en el paso 1 son una promesa, no un hecho — entre firmar la URL y subir, nada impide mandar otra cosa.

La versión va **en la ruta del objeto** (`.../v1/`, `.../v2/`), así que una versión nueva no puede sobrescribir a la anterior ni por accidente.

### Aprobaciones

```
PENDIENTE → EN_REVISION → CAMBIOS_SOLICITADOS → NUEVA_VERSION → APROBADO
```

Las transiciones válidas viven en `packages/shared` y las usan los dos lados: el frontend para saber qué botones ofrecer, la API para autorizar. `APROBADO` y `RECHAZADO` son terminales — si hace falta otra decisión, se crea una aprobación sobre la nueva versión.

`Approval` guarda el estado actual; `ApprovalEvent` guarda **cómo se llegó ahí**, escrito en la misma transacción. Un historial que pudiera quedar incompleto no serviría como trazabilidad.

### Eventos de dominio

Los servicios de negocio emiten eventos; notificaciones y actividad los escuchan. `renders.service` no sabe nada de plantillas de email ni de destinatarios, y añadir un canal nuevo (WhatsApp) se toca en un solo sitio. La línea de tiempo se alimenta de los mismos eventos, así que no hay forma de olvidarse de registrar algo al añadir un módulo.

### Visibilidad de proyectos

Quién ve qué se decide en el `where` de la consulta, **no filtrando después de leer**: un cliente nunca llega a cargar en memoria proyectos ajenos.

| Rol | Alcance |
|---|---|
| `ADMIN`, `PROJECT_MANAGER` | todos los proyectos |
| `TECHNICIAN`, `CLIENT` | solo aquellos donde son miembros (`ProjectMember`) |

Pedir un proyecto ajeno por su UUID devuelve **404 con el mismo mensaje** que un proyecto inexistente. Un 403 confirmaría a un tercero que ese proyecto es real.

Reglas que protegen la integridad de los datos:
- Un usuario `CLIENT` **no puede añadirse a un proyecto de otra empresa**, aunque un PM lo intente por error: sería abrir el proyecto de un cliente a otro.
- Un proyecto no puede quedarse sin `OWNER`.
- Clientes y proyectos **se desactivan o archivan, nunca se borran**. `Client → Project` es `onDelete: Restrict` para que un DELETE accidental no arrastre renders aprobados y su historial.
- Marcar un proyecto como `FINALIZADO` fija el avance al 100% y la fecha de fin automáticamente.
- El código `PRY-2026-001` se genera solo, con reintento ante colisión por concurrencia.

### Autenticación

Access token JWT de 15 minutos + refresh token **opaco** de 7 días. El refresh no es un JWT a propósito: se guarda como HMAC en la base de datos, así que un volcado de la BD sin el secreto de la aplicación no permite fabricar tokens.

**Rotación con detección de reuso.** Cada refresh se usa una sola vez y se marca consumido. Presentar uno ya consumido solo puede significar que alguien tiene una copia robada, así que se revoca la familia entera de esa sesión: el legítimo vuelve a entrar, el atacante se queda fuera.

La distinción entre *revocado* y *borrado* importa y es deliberada:

| Situación | Qué se hace con las filas | Mensaje |
|---|---|---|
| Rotación normal | se marca `revokedAt` (la fila sobrevive) | — |
| Reuso detectado | se marca toda la familia | `Sesion comprometida` |
| Logout / cambio de contraseña | se **borran** las filas | `Sesion invalida` |

Si el logout también dejara filas marcadas, cerrar sesión con normalidad acabaría reportando "sesión comprometida" y el aviso perdería todo su valor.

Otras defensas ya activas:
- **Enumeración de cuentas**: el login verifica un hash ficticio cuando el email no existe, para que el tiempo de respuesta no delate qué cuentas están registradas. `forgot-password` responde siempre lo mismo.
- **Rate limiting**: 5 intentos de login por minuto, 3 de `forgot-password`. Global de 120/min.
- **Asignación masiva**: el `ValidationPipe` rechaza cualquier campo no declarado en el DTO, así que no se puede colar `"role":"ADMIN"` en un update de perfil.
- **Cambio de contraseña o reset** cierra todas las sesiones abiertas.
- **Estado del usuario en cada request**: la estrategia JWT lee el usuario de la BD en vez de fiarse del token, para que desactivar una cuenta surta efecto de inmediato.

### Decisiones de diseño

**Las versiones son inmutables.** `Render` y `ProjectFile` son contenedores; cada versión es una fila que nunca se sobrescribe. Es lo que exige la trazabilidad de aprobaciones: una aprobación apunta a una versión concreta que debe seguir existiendo igual años después.

**Los archivos no pasan por la API.** NestJS valida permisos y firma URLs de MinIO; el binario viaja navegador ↔ MinIO directamente. Un render de 40 MB atravesando Node sería el primer cuello de botella del portal.

**Todo acceso pasa por `ProjectMember`.** Ninguna consulta confía en el `projectId` que llega del cliente. Sin esto, un cliente que adivine un UUID podría leer el proyecto de otro.

**El storage está detrás de una interfaz.** Migrar a Cloudflare R2 o S3 es cambiar variables de entorno, no reescribir módulos.

