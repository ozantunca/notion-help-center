# syntax=docker/dockerfile:1

# ---- base: Node + pnpm (version from package.json "packageManager") ----
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---- deps: install with build tools (better-sqlite3 is a native module) ----
FROM base AS deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY widget/package.json widget/pnpm-lock.yaml ./widget/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store cd widget && pnpm install --frozen-lockfile

# ---- build: widget bundle + Next.js standalone server ----
FROM deps AS build
COPY . .
RUN mkdir -p public && cd widget \
 && pnpm build \
 && cp dist/widget.iife.global.js ../public/widget.js \
 && npm pack --pack-destination ../public \
 && mv ../public/notion-help-center-widget-*.tgz ../public/widget.tgz
# File tracing copies runtime state that the build created (the SQLite file from
# pre-rendering /contact, JSON mirrors). It must not ship in the image or seed volumes.
RUN NEXT_OUTPUT_STANDALONE=1 pnpm build \
 && rm -rf .next/standalone/data .next/standalone/public

# ---- runtime ----
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# curl: hosting platforms (Coolify, Dokploy, CapRover, ...) run their own health
# check with curl or wget and roll the deploy back when neither exists.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && chmod +x /usr/local/bin/docker-entrypoint.sh \
 && mkdir -p /app/data /app/media \
 && chown node:node /app/data /app/media

# SQLite database and downloaded media. Mount named volumes here.
VOLUME ["/app/data", "/app/media"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Starts as root only to fix volume ownership, then runs the server as `node`.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
