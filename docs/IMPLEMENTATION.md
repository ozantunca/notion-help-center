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
| `lib/site-config.ts` | Defaults, normalization, `applyThemeToDocument` |
| `lib/site-config-env.ts` | Remote logo download (Notion sync + admin save) |
| `lib/admin-auth.ts` | Basic auth verification for admin routes |
| `middleware.ts` | Protects `/admin` and `/api/admin/*` |
| `pages/admin/index.tsx` | Site settings form |
| `pages/api/admin/site-config.ts` | GET/POST site config (authenticated) |
| `pages/api/media/[[...path]].ts` | Serves files from `getHelpMediaDir()` at `/media/*` (rewrite) |
| `lib/media-dir.ts` | `HELP_CENTER_MEDIA_DIR`; default `/app/media` if `cwd === '/app'`, else `public/media` |
| `lib/public-dir.ts` | `HELP_CENTER_PUBLIC_DIR` for JSON mirrors (default `public`) |
| `pages/api/admin/upload-logo.ts` | POST base64 data URL → media dir (authenticated) |
| `components/admin/ColorField.tsx` | Admin theme color preview + picker + CSS text |
| `components/admin/NavLinksEditor.tsx` | Admin header/footer link rows |
| `lib/admin-logo-upload.ts` | Decode and save uploaded logo files |
| `pages/api/site-config.ts` | Public JSON site config (SQLite / file) |
| `components/SiteConfigProvider.tsx` | Bootstrap from `_siteConfig` in `pageProps`; inline `:root` CSS for theme |
| `pages/_app.tsx` | `getInitialProps` merges `loadSiteConfig()` as `_siteConfig` **only when `typeof window === 'undefined'`** so the client bundle never loads SQLite |
| `next.config.js` | Client: `better-sqlite3` → `false`; `NormalModuleReplacementPlugin` swaps `lib/help-data.ts` for `help-data.client-stub.ts` so no `fs`/SQLite in the browser (dynamic imports from `_app` are still resolved) |
| `lib/help-data.client-stub.ts` | Browser-only stubs; real `help-data` runs on the server |
| `lib/notion.ts` | Fetches collections (incl. Notion **page icon** → `icon` field) |
| `components/CollectionIcon.tsx` | Category / breadcrumb icon: emoji or image URL |
| `lib/run-notion-sync.ts` | Shared Notion → SQLite + exports (used by CLI sync and periodic job) |
| `lib/sync-notion-cron.ts` | Optional `node-cron` scheduler when `HELP_CENTER_SYNC_CRON` is set; also triggers one sync when the server starts |
| `instrumentation.ts` | Next.js hook: in Node only, dynamically imports `instrumentation-node.ts` (avoids Edge bundle pulling `path` / SQLite) |
| `instrumentation-node.ts` | Registers periodic Notion sync (`node-cron` + `runNotionSync`) |
| `scripts/sync-notion.ts` | CLI: loads `.env.local`, runs `runNotionSync()` |
| `scripts/seed-demo.ts` | Demo data without Notion |
| `scripts/regenerate-search-index.ts` | Rebuild Lunr from current articles |

## Environment variables

See [`.env.example`](../.env.example).

- `NOTION_API_KEY`, `NOTION_DATABASE_ID` — required for sync.
- `HELP_CENTER_SYNC_CRON` — optional [node-cron](https://www.npmjs.com/package/node-cron) expression; when set, the Next.js server runs the same sync as `pnpm run sync` **once on startup** and then on that schedule (single-instance deployments). Empty or unset disables the scheduler and startup sync. Invalid expressions are logged and ignored.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — enable `/admin` (see [ADMIN.md](./ADMIN.md)).
- `HELP_CENTER_URL` — canonical URL for sitemap (default `http://localhost:3000` in dev).
- `HELP_CENTER_HTTP_USER_AGENT` — optional, when downloading images in sync.
- `HELP_CENTER_DATA_DIR` — optional; directory for `help-center.db` and `metadata.json` (default `{cwd}/data`). Use an absolute path in Docker when the DB volume is not under the app working directory.
- `HELP_CENTER_MEDIA_DIR` — optional; directory for assets at `/media/*`. If unset: **`/app/media`** when `process.cwd()` is `/app`, else **`{cwd}/public/media`**. `next.config.js` rewrites `/media` → `/api/media`.
- `HELP_CENTER_PUBLIC_DIR` — optional; directory for `site-config.json` and `search-index.json` (default `{cwd}/public`). Use when the image has no `public/` folder; the app creates the directory on write.
- `NEXT_PUBLIC_CRISP_WEBSITE_ID`, `NEXT_PUBLIC_FORMSPREE_FORM_ID` — optional contact channels.

## Data flow

1. **Sync** (manual `pnpm run sync`, or when `HELP_CENTER_SYNC_CRON` is set: once at Node server start plus on the cron schedule) loads collections, sub-collections, articles, markdown per article, builds Lunr index, preserves site config from DB/file (remote logo → `/media` when applicable), then `saveHelpCenterData({ ... })`. Overlapping runs are skipped if a sync is still in progress.
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

## Widget / embed

If you embed search in another app, you can serve `GET /search-index.json` (when generated) for Lunr on the client. Keep CORS and deployment in mind.
