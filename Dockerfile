# syntax=docker/dockerfile:1.7

# VerifScan — Dockerfile for Coolify
# Multi-stage build producing a minimal production image with:
#   - Next.js 16 standalone output (node .next/standalone/server.js)
#   - Prisma client + schema
#   - scripts/create-admin.cjs for first-boot admin seeding
#   - curl for Coolify healthcheck
#   - Non-root runtime user
#   - Persistent volume at /app/data for SQLite

ARG NODE_VERSION=20.20.2

# ───────────────────────────── 1. deps ─────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

# OpenSSL needed by Prisma engine on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* bun.lockb* ./
COPY prisma ./prisma

# Install full deps (including devDeps needed by next build)
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Generate Prisma client early so it can be reused by builder
RUN npx prisma generate

# ───────────────────────────── 2. builder ─────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

COPY . .

# Build Next.js standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate \
 && npm run build

# ───────────────────────────── 3. runner ─────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

# Runtime deps: openssl for Prisma, curl for Coolify healthcheck, wget as fallback
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl wget tini \
  && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Persistent data dir for SQLite AND uploaded files (mount as volume in Coolify)
# - /app/data/verifscan.db : SQLite database
# - /app/data/uploads/<userId>/<filename> : PDFs, images, videos uploaded by fabricants
# Both survive container redeployments when /app/data is mounted as a Coolify persistent volume.
RUN mkdir -p /app/data/uploads /app/public \
 && chown -R nextjs:nodejs /app

# --- Copy standalone server ---
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# --- Copy public assets ---
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# --- Copy Prisma artifacts ---
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# --- Copy bcryptjs (needed by create-admin.cjs but not bundled by Next.js standalone trace) ---
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# --- Copy admin-seeding script ---
COPY --from=builder --chown=nextjs:nodejs /app/scripts/create-admin.cjs ./scripts/create-admin.cjs

# --- Copy package.json (needed by create-admin.cjs to resolve bcryptjs/prisma) ---
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Default env (override at runtime via Coolify)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/data/verifscan.db"

USER nextjs

EXPOSE 3000

# Healthcheck — Coolify requires curl or wget in the image
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

# Entrypoint: push prisma schema (creates tables if missing), seed admin, then start server.
# We use a small inline shell so we don't need an extra entrypoint.sh file in the image.
ENTRYPOINT ["/usr/bin/tini", "--", "sh", "-c", "\
  npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -5 ; \
  node scripts/create-admin.cjs ; \
  exec node server.js \
"]
