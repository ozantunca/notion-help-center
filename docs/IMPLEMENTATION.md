# Implementation notes

## Overview

**Notion Help Center** is an open-source, **Notion-backed** (or **seeded**) documentation site:

1. **Next.js** — SSR for home, collection, and article pages (live DB each request); SSG/ISR for contact; SSR for search and legacy redirects.
2. **SQLite** (`data/help-center.db`) — canonical storage for collections, articles (markdown body), Lunr search snapshot, optional serialized site config, and article feedback.
3. **Sync** — `pnpm run sync` pulls Notion, fills SQLite, and writes optional JSON mirrors (`data/metadata.json`, `public/search-index.json`, `public/site-config.json`).
4. **Theme** — Base tokens in `styles/globals.css`; each request’s theme is injected by `SiteConfigProvider` via an inline `<style>` built from `_app.getInitialProps` (`loadSiteConfig()`), so the client does not refetch config and there is no branding/theme flash. Optional `GET /api/site-config` remains for embeds. Branding is edited at **`/admin`** when `ADMIN_USERNAME` / `ADMIN_PASSWORD` are set.

## Key files

| Path | Role |
|------|------|
| `lib/db.ts` | SQLite path, schema, legacy `feedback.db` migration |
| `lib/data-dir.ts` | `HELP_CENTER_DATA_DIR` → SQLite / `metadata.json` base path |
| `lib/help-data.ts` | Load/save content and search; JSON fallbacks for migration |
| `lib/site-config.ts` | Defaults, normalization, `applyThemeToDocument`; `isSafeCssValue` / `sanitizeUrl` validate theme values and link schemes |
| `lib/site-config-env.ts` | Remote logo download (Notion sync + admin save) |
| `lib/admin-auth.ts` | Basic auth verification (constant-time compare, Edge-safe); `hasJsonContentType` CSRF guard |
| `middleware.ts` | Protects `/admin` and `/api/admin/*` |
| `pages/admin/index.tsx` | Site settings form |
| `pages/api/admin/site-config.ts` | GET/POST site config (authenticated) |
| `pages/api/media/[[...path]].ts` | Serves files from `getHelpMediaDir()` at `/media/*` (rewrite); path-traversal checks, `nosniff` + `sandbox` CSP |
| `lib/media-dir.ts` | `HELP_CENTER_MEDIA_DIR`; default `/app/media` if `cwd === '/app'`, else `public/media` |
| `lib/public-dir.ts` | `HELP_CENTER_PUBLIC_DIR` for JSON mirrors (default `public`) |
| `pages/api/admin/upload-logo.ts` | POST base64 data URL → media dir (authenticated) |
| `components/admin/ColorField.tsx` | Admin theme color preview + picker + CSS text |
| `components/admin/NavLinksEditor.tsx` | Admin header/footer link rows |
| `lib/admin-logo-upload.ts` | Decode and save uploaded logo files |
| `lib/media.ts` | Media download/rehost: scheme check per redirect hop, 5-redirect cap, 25 MB / 20 s limits, filename sanitization |
| `pages/api/feedback.ts` | Anonymous article feedback → SQLite; bounded input, per-IP throttle |
| `lib/cors.ts` | `PUBLIC_API_CORS_ORIGIN` allowlist for `/api/v1/*` |
| `pages/api/site-config.ts` | Public JSON site config (SQLite / file) |
| `components/SiteConfigProvider.tsx` | Bootstrap from `_siteConfig` in `pageProps`; inline `:root` CSS for theme |
| `pages/_app.tsx` | `getInitialProps` merges `loadSiteConfig()` as `_siteConfig` **only when `typeof window === 'undefined'`** so the client bundle never loads SQLite |
| `next.config.js` | Client: `better-sqlite3` → `false`; `NormalModuleReplacementPlugin` swaps `lib/help-data.ts` for `help-data.client-stub.ts` so no `fs`/SQLite in the browser (dynamic imports from `_app` are still resolved). Also sets baseline security headers via `headers()` |
| `lib/help-data.client-stub.ts` | Browser-only stubs; real `help-data` runs on the server |
| `lib/notion.ts` | Fetches collections (incl. Notion **page icon** → `icon` field) |
| `components/CollectionIcon.tsx` | Category / breadcrumb icon: emoji or image URL |
| `lib/run-notion-sync.ts` | Shared Notion → SQLite + exports (used by CLI sync and periodic job) |
| `lib/sync-notion-cron.ts` | `node-cron` scheduler; default `0 */6 * * *` if `HELP_CENTER_SYNC_CRON` unset; immediate sync once in production when Notion env vars are set |
| `instrumentation.ts` | Next.js hook: in Node only, dynamically imports `instrumentation-node.ts` (avoids Edge bundle pulling `path` / SQLite) |
| `instrumentation-node.ts` | Registers periodic Notion sync (`node-cron` + `runNotionSync`) |
| `lib/instrumentation-node.edge-stub.ts` | Webpack replaces `instrumentation-node.ts` for the **Edge** instrumentation graph only (avoids bundling `path` / `fs`); see `next.config.js` |
| `scripts/sync-notion.ts` | CLI: loads `.env.local`, runs `runNotionSync()` |
| `scripts/seed-demo.ts` | Demo data without Notion |
| `scripts/regenerate-search-index.ts` | Rebuild Lunr from current articles |

## Environment variables

See [`.env.example`](../.env.example).

- `NOTION_API_KEY`, `NOTION_DATABASE_ID` — required for sync.
- `HELP_CENTER_SYNC_CRON` — optional [node-cron](https://www.npmjs.com/package/node-cron) expression while the server runs (single-instance deployments). If unset or empty, the default is **`0 */6 * * *`** (every six hours, server timezone). Invalid expressions are logged and the scheduler is not started. In **production**, when Notion env vars are set, one sync also runs immediately after the cron is registered (so the site is not empty until the first tick).
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — enable `/admin` (see [ADMIN.md](./ADMIN.md)).
- `HELP_CENTER_URL` — canonical URL for sitemap (default `http://localhost:3000` in dev).
- `HELP_CENTER_HTTP_USER_AGENT` — optional, when downloading images in sync.
- `HELP_CENTER_DATA_DIR` — optional; directory for `help-center.db` and `metadata.json` (default `{cwd}/data`). Use an absolute path in Docker when the DB volume is not under the app working directory.
- `HELP_CENTER_MEDIA_DIR` — optional; directory for assets at `/media/*`. If unset: **`/app/media`** when `process.cwd()` is `/app`, else **`{cwd}/public/media`**. `next.config.js` rewrites `/media` → `/api/media`.
- `HELP_CENTER_PUBLIC_DIR` — optional; directory for `site-config.json` and `search-index.json` (default `{cwd}/public`). Use when the image has no `public/` folder; the app creates the directory on write.
- `NEXT_PUBLIC_CRISP_WEBSITE_ID`, `NEXT_PUBLIC_FORMSPREE_FORM_ID` — optional contact channels.

## Data flow

1. **Sync** (manual `pnpm run sync`, **node-cron** with default `0 */6 * * *` when `HELP_CENTER_SYNC_CRON` is unset, plus one immediate production sync when Notion env vars are set) loads collections, sub-collections, articles, markdown per article, builds Lunr index, preserves site config from DB/file (remote logo → `/media` when applicable), then `saveHelpCenterData({ ... })`. Overlapping runs are skipped if a sync is still in progress.

   **Media rehosting limits.** Notion content is semi-trusted input, so every image/video/file download in `lib/media.ts` enforces `http(s)` on each redirect hop, follows at most **5 redirects**, and aborts past **25 MB** or **20 s**. A failed asset is logged and skipped — the article still syncs, keeping its original remote URL. If a legitimately large asset stops appearing after a sync, check the sync log for `Asset exceeds` and raise `MAX_DOWNLOAD_BYTES` in `lib/media.ts`.
2. **Pages** call `loadHelpMetadata()` / `loadSiteConfig()` (server). Site config is read from SQLite, then `public/site-config.json`, then defaults.
3. **Search** (`pages/search.tsx`) uses `loadSearchSnapshot()` (DB, then `public/search-index.json` fallback).

## Dynamic content routes

Home (`/`), **`/collection/[collectionId]`**, and **`/[collectionId]/[subCollectionId]/[slug]/[articleId]`** use **`getServerSideProps`**, so each request uses the **live** SQLite database. That removes dependence on paths precomputed at build time and avoids ISR caching stale content after a sync.

The **contact** page uses **`getStaticProps`** with **`revalidate: 60`**.

## Persistent storage (Docker / hosts)

Keep on a volume or durable disk:

- **`data/`** — especially `help-center.db` (content, search snapshot, `site_config`, feedback).
- **`/app/media`** (Docker default) — uploaded/synced images and logos. Do not replace **`/app/public`** with your git checkout — see [DOCKER.md](./DOCKER.md).
- **`public/site-config.json`** — updated on every admin save and sync; persist alongside the DB so the JSON mirror is not lost on ephemeral filesystems.

## OSS artifact policy

Generated files are listed in `.gitignore`. Clone → `pnpm install` → `pnpm run seed` for a quick demo, or configure Notion and run `pnpm run sync`.

## Article URLs

Canonical paths: `/{collectionSlug}/{subCollectionId}/{articleSlug}/{articleId}` (see `lib/article-url.ts`). Legacy three-segment URLs redirect with `getServerSideProps`.

## Public REST API (`/api/v1/*`)

A versioned public API powers the client widget and can be called directly:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/config` | Brand name, logo, colors (from `loadSiteConfig()`) |
| `GET /api/v1/collections` | All collections with nested subcollections |
| `GET /api/v1/articles` | Published articles (metadata, no content). Query: `?collectionId=`, `?suggested=true` |
| `GET /api/v1/articles/:id` | Single published article with full markdown content |
| `GET /api/v1/search?q=` | Lunr full-text search, published articles only |

CORS headers are set on all `/api/v1/*` routes via `lib/cors.ts`, controlled by the `PUBLIC_API_CORS_ORIGIN` env var. Provide a comma-separated list of allowed origins (exact match on the request `Origin` header), or `*` to allow any origin. If the var is unset, no `Access-Control-Allow-Origin` header is sent.

## Article feedback (`POST /api/feedback`)

Anonymous by design — the article page posts `{ articleId, rating, comment? }` and rows land in the `article_feedback` table. Because it is unauthenticated and writes to disk, input is bounded (`articleId` ≤ 200 chars, `comment` ≤ 2000 chars) and a per-IP throttle allows **10 requests per 60 s**, returning **429** with `Retry-After` past that.

The throttle is **in-process**: each instance keeps its own counters, so it does not hold across a multi-instance deployment. Put a real rate limiter in the proxy if the site is publicly reachable.

## Security

Trust boundaries, the controls implementing them, and the deployment checklist live in **[SECURITY.md](../SECURITY.md)**. Two constraints worth knowing before editing this codebase:

- **Markdown is rendered without `rehype-raw`**, so raw HTML in Notion content is escaped rather than parsed. Adding `rehype-raw` re-enables HTML injection from anyone who can edit the Notion database — pair it with `rehype-sanitize` if you ever need it.
- **Theme values and link URLs are validated** in `lib/site-config.ts` before reaching the inline `<style>` tag and `href` attributes. Widening `isSafeCssValue` or `sanitizeUrl` re-opens the injection paths they close.

## Client widget

A floating help center widget lives in `widget/` and is distributed two ways — both from the help center server itself:

- **`/widget.js`** — IIFE bundle for `<script>` tag embed. Auto-initialises from the `data-api-url` attribute on the script element.
- **`/widget.tgz`** — npm-installable tarball. Customers run `npm install https://your-host/widget.tgz` and import `{ HelpCenterWidget }` or `{ init }`. No npm registry required.

Built with tsup (`widget/tsup.config.ts`). Run `pnpm run build:widget` to produce both files under `public/`. The `widget/` source is standard TypeScript React; `widget/src/hooks/useApi.ts` wraps the `/api/v1/*` endpoints.

The widget fetches brand colors from `GET /api/v1/config` and applies them as CSS variables (`--nhc-primary`, `--nhc-primary-hover`) on the `#nhc-widget` root element, so the launcher button and panel header automatically match the help center's theme.
