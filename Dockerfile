# syntax=docker/dockerfile:1

# Notion Help Center — production image.
#
# Layout matches docs/DOCKER.md: WORKDIR /app, SQLite under /app/data, media
# under /app/media. Mount named volumes on both; never bind-mount the repo onto
# /app or /app/public (that publishes your source tree at the web root).
#
#   docker build -t notion-help-center:latest .
#   docker run -p 3000:3000 --env-file .env.local \
#     -v notion_help_center_data:/app/data \
#     -v notion_help_center_media:/app/media \
#     notion-help-center:latest

# better-sqlite3 supports Node 20/22/23/24/25 (see "engines" in package.json).
ARG NODE_IMAGE=node:22-bookworm-slim

# ---------------------------------------------------------------------------
# base — pnpm via corepack, pinned by package.json "packageManager"
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# deps — full dependency tree (dev deps needed to run `next build`)
#
# better-sqlite3 is a native module. It normally resolves a prebuilt binary,
# but the toolchain is installed so it can compile from source on platforms
# with no prebuild (e.g. linux/arm64 on some releases) instead of failing.
# ---------------------------------------------------------------------------
FROM base AS deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# builder — compile the Next.js app
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` only compiles here. Content sync happens at runtime: with
# NOTION_* set, the app syncs once on startup and then on HELP_CENTER_SYNC_CRON,
# so no Notion credentials are needed at build time.
RUN pnpm run build

# ---------------------------------------------------------------------------
# prod-deps — runtime dependencies only
#
# Built on the same base as the runner so the compiled better-sqlite3 binary
# matches the runtime's platform and Node ABI.
# ---------------------------------------------------------------------------
FROM base AS prod-deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---------------------------------------------------------------------------
# runner
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder  /app/.next        ./.next
COPY package.json next.config.js ./

# `public/` is not tracked in this repo, so there is nothing to COPY. Create it
# instead: Next serves static files from ./public, and the app writes the
# site-config.json / search-index.json mirrors there (HELP_CENTER_PUBLIC_DIR).
# /app/data and /app/media are volume mount points — pre-creating them owned by
# `node` means a fresh named volume inherits that ownership and stays writable
# for the non-root user.
RUN mkdir -p /app/data /app/media /app/public \
 && chown -R node:node /app/data /app/media /app/public

USER node

EXPOSE 3000

# /api/site-config returns defaults even before the first sync, so this reports
# process health without depending on synced content.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/site-config').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "start"]
