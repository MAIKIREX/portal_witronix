FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN apk add --no-cache libc6-compat openssl

# --- 1. Dependencias ---
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# --- 2. Compilacion ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Compilar shared, generar prisma y compilar api
RUN pnpm --filter @witronix/shared build
RUN pnpm --filter @witronix/api prisma:generate
RUN pnpm --filter @witronix/api build

# --- 3. Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nestjs:nodejs /app/apps/api ./apps/api

RUN chmod +x /app/apps/api/docker-entrypoint.sh

USER nestjs

EXPOSE 3001

ENTRYPOINT ["/bin/sh", "/app/apps/api/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main"]
