#!/bin/sh
set -e

echo ">> Aplicando migraciones de Prisma a la base de datos..."
./apps/api/node_modules/.bin/prisma migrate deploy --schema=./apps/api/prisma/schema.prisma || pnpm --filter @witronix/api prisma:deploy || true

echo ">> Iniciando API..."
exec "$@"
