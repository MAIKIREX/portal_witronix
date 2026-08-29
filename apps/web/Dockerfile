FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN apk add --no-cache libc6-compat

# --- 1. Dependencias ---
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# --- 2. Compilacion ---
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Compilar shared y luego web
RUN pnpm --filter @witronix/shared build
RUN pnpm --filter @witronix/web build

# --- 3. Runner Produccion ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# En el modo standalone monorepo de Next.js, public y static deben copiarse a su ruta correspondiente
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
