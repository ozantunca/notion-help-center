# Notion Help Center

The fastest way to turn your Notion knowledge base into a branded, searchable help center.

Write content in Notion, then publish it on your own domain with a clean docs experience powered by Next.js and SQLite.

Licensed under **Apache-2.0** — see [LICENSE](./LICENSE).

**Live example:** [help.wavevisual.com](https://help.wavevisual.com)

---

## Screenshots

### Notion CMS database (source of truth)

![Notion knowledge base database template](./docs/screenshots/notion-database-template.png)

### Published help center experience

![WaveVisual Help Center homepage](./docs/screenshots/help-center-home.png)

---

## Why teams use this

- **Notion-native workflow** — keep writing in Notion where your team already works
- **Customer-ready docs site** — full-text search and structured article pages out of the box
- **Fast setup** — launch quickly with a proven Notion template and straightforward deployment
- **No platform lock-in** — self-hosted, your domain, your data
- **No-code branding controls** — update logo, theme, and navigation in `/admin`

---

## How it works

1. You create and manage help content in a Notion database.
2. The app syncs your collections and articles into SQLite.
3. You deploy a fast help center that your customers can browse and search.

---

## Quickstart with Notion

### 1) Duplicate the Notion template

Duplicate the [HelpKit Knowledge Base Template](https://helpkit.notion.site/HelpKit-Knowledge-Base-Academy-Template-32b504ebbf8a4a31baa2637f1ea24490) into your workspace.  
This is the recommended structure and the same template used by [HelpKit](https://www.helpkit.so).

**Order on the site** follows Notion:

- **Sections** (the article databases on a collection page) appear in the order they have on that page.
- **Collections and articles** appear in the order you created them. The Notion API cannot read a view's drag-and-drop order, so to set it yourself, add a **Number** property named `Order` to the database. Rows with an `Order` value come first, lowest first; rows without one follow in creation order.

The new order shows after the next sync.

### 2) Create a Notion integration

- Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
- Create an integration
- Share your duplicated database with that integration
- Copy the integration token and database ID

### 3) Configure your environment

```bash
cp .env.example .env.local
```

At minimum, set:

```env
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
HELP_CENTER_URL=https://docs.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
```

### 4) Sync and run

Install [pnpm](https://pnpm.io/installation) (or run `corepack enable` so Node uses the version in `package.json`’s `packageManager` field).

```bash
pnpm install
pnpm run sync
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production builds, use:

```bash
pnpm run build:with-sync
pnpm start
```

**Production:** With `NOTION_API_KEY` and `NOTION_DATABASE_ID` on the server, the app registers **node-cron** with **`HELP_CENTER_SYNC_CRON` or, if unset, a default of every six hours (`0 */6 * * *`)**, and runs **one sync right after startup** so you do not need `pnpm run sync` in the build step. To sync at any other time, click **Sync now** in `/admin`, or run `help-center-sync` (or `npm run sync`) in the container, e.g. `docker exec <container> help-center-sync` or the Coolify terminal. Override the interval by setting `HELP_CENTER_SYNC_CRON`. Persist **`/app/data`** (and **`/app/media`**) on a volume so content survives redeploys. See [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) and [docs/DOCKER.md](./docs/DOCKER.md).

---

## Deploy (Docker)

Every release publishes an image for `linux/amd64` and `linux/arm64` to the GitHub Container Registry:

```
ghcr.io/ozantunca/notion-help-center
```

### 1) Create an env file

```bash
cp .env.example .env.local
```

Make sure `NOTION_API_KEY`, `NOTION_DATABASE_ID`, and `HELP_CENTER_URL` are set.

### 2) Run with persistent volumes

```bash
docker run -d -p 3000:3000 \
  --env-file .env.local \
  -v notion_help_center_data:/app/data \
  -v notion_help_center_media:/app/media \
  --name help-center \
  ghcr.io/ozantunca/notion-help-center:1
```

Or use [docker-compose.example.yml](./docker-compose.example.yml).

> **Important:** Mount `/app/data` and `/app/media` as named volumes, not your repo directory. See [docs/DOCKER.md](./docs/DOCKER.md).

The container reports its state at `/api/health` and Docker marks it healthy or unhealthy from that.

### Which tag to use

| Tag | You get |
|-----|---------|
| `:1` | **Recommended.** All new features and fixes of version 1, never a breaking change. |
| `:1.2` | Fixes only (patch releases) for 1.2. |
| `:1.2.0` | Exactly this version. You update by hand. |
| `:latest` | The newest release, including future major versions. Not recommended for production. |

### Build the image yourself

```bash
docker build -t notion-help-center .
```

---

## Upgrading

1. **Read the [changelog](./CHANGELOG.md)** for the versions between yours and the new one. Look for **Upgrade notes**. Major versions (for example 1.x → 2.0) always have them.
2. **Back up** the `/app/data` volume. It holds the SQLite database with your `/admin` settings and article feedback.
3. **Pull and restart:**

   ```bash
   docker pull ghcr.io/ozantunca/notion-help-center:1
   docker rm -f help-center
   # then run the same `docker run` command as above
   ```

   With Compose: `docker compose pull && docker compose up -d`.

On start, the app updates the database schema when needed. Before it changes anything, it copies the database to `help-center.db.backup-v<old schema version>` in the same volume. If an upgrade goes wrong, stop the container, rename that file back to `help-center.db`, and run the previous image tag.

An older image refuses to start on a database that a newer release has changed (`/api/health` returns 503 and the log says why). This prevents data loss when you roll back without restoring the backup.

Your branding, colours and links from `/admin` live in the database, so they survive every upgrade. Changes to the source code do not: if you fork, you merge each release yourself.

The running version is shown in `/admin` and returned by `/api/health` and `/api/v1/config`.

### Versioning policy

Releases follow [Semantic Versioning](https://semver.org/):

- **Major** (`2.0.0`): you must do something when you upgrade. Examples: a renamed environment variable, a changed volume layout, changed article URLs, or a database change that needs manual steps. The changelog says what to do.
- **Minor** (`1.3.0`): new features. Safe to upgrade without changes.
- **Patch** (`1.2.1`): bug and security fixes. Safe to upgrade without changes.

The embeddable widget (`/widget.js`, `/widget.tgz`) always has the same version as the help center that serves it.

---

## Customize without code

With `ADMIN_USERNAME` and `ADMIN_PASSWORD` set, open `/admin` to:

- Upload or link a logo
- Edit brand colors and custom CSS
- Configure navigation links

Settings are stored in SQLite and persist across restarts. See [docs/ADMIN.md](./docs/ADMIN.md).

---

## Client widget

Embed a floating help center widget on any external site — no npm account or third-party service required. The widget is built and served directly from your help center server.

### Script tag (any site)

```html
<script src="https://your-help-center.com/widget.js"
        data-api-url="https://your-help-center.com"></script>
```

### npm install (React / Next.js apps)

```bash
npm install https://your-help-center.com/widget.tgz
```

```tsx
import { HelpCenterWidget } from 'notion-help-center-widget';

<HelpCenterWidget apiUrl="https://your-help-center.com" />
```

Or call `init()` programmatically (framework-agnostic):

```ts
import { init } from 'notion-help-center-widget';
init({ apiUrl: 'https://your-help-center.com' });
```

### Building the widget

Run once before starting the server (or add to your deploy step):

```bash
pnpm run build:widget
```

This produces `public/widget.js` (IIFE bundle) and `public/widget.tgz` (npm-installable tarball), both served as static files by Next.js.

### CORS

The widget calls the public REST API (`/api/v1/*`) from the customer's domain. Set `PUBLIC_API_CORS_ORIGIN` to allow cross-origin requests. Use a comma-separated list of exact origins, or `*` for any origin:

```env
PUBLIC_API_CORS_ORIGIN=*
# or restrict to specific origins:
PUBLIC_API_CORS_ORIGIN=https://wavevisual.com,https://www.wavevisual.com,http://localhost:3000
```

When multiple origins are listed, the server checks the request `Origin` header and echoes back only matching origins.

### Public REST API

The widget is powered by a versioned public API. You can also call these endpoints directly:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/config` | Brand name, logo, colors, support email |
| `GET /api/v1/collections` | Collections with nested subcollections |
| `GET /api/v1/articles` | Published articles (metadata). Filters: `?collectionId=`, `?suggested=true` |
| `GET /api/v1/articles/:id` | Single article. `content` is markdown; `contentHtml` is the same article as sanitised HTML (tables, toggles, callouts, task lists), ready to embed |
| `GET /api/v1/search?q=` | Full-text search (Lunr), published articles only |

---

## Technical reference

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | Yes | Integration token from notion.so/my-integrations |
| `NOTION_DATABASE_ID` | Yes | Root database ID containing your collections |
| `HELP_CENTER_URL` | Yes | Public URL (e.g. `https://docs.example.com`) used for sitemap and absolute links |
| `ADMIN_USERNAME` | Recommended | Enables `/admin` with HTTP Basic auth |
| `ADMIN_PASSWORD` | Recommended | Password for `/admin` |
| `PUBLIC_API_CORS_ORIGIN` | Optional | Comma-separated allowlist for `/api/v1/*` CORS (e.g. `https://app.com,http://localhost:3000`) or `*` |
| `HELP_CENTER_DATA_DIR` | Optional | Override SQLite directory (default: `./data`, or `/app/data` in Docker) |
| `HELP_CENTER_MEDIA_DIR` | Optional | Override media directory (default: `./public/media`, or `/app/media` in Docker) |
| `HELP_CENTER_PUBLIC_DIR` | Optional | Override writable public directory for `site-config.json` (default: `./public`) |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | Optional | Crisp chat widget ID for the contact page |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Optional | Formspree form ID for the contact page (used if Crisp is not set) |

See [`.env.example`](./.env.example) for the full template.

### Scripts

| Script | Purpose |
|--------|---------|
| `pnpm run dev` | Next.js dev server |
| `pnpm run build` | Production build |
| `pnpm run build:with-sync` | Sync from Notion, then build (recommended for production) |
| `pnpm run build:widget` | Build `public/widget.js` and `public/widget.tgz` (run before deploying; the Docker image does this for you) |
| `pnpm run dev:widget` | Watch mode for widget development |
| `pnpm run sync` | Fetch Notion to SQLite. In the Docker image: `help-center-sync` or `npm run sync` |
| `pnpm run seed` | Seed sample articles for local demo/testing |
| `pnpm run typecheck` | TypeScript check |

### Local demo mode (for developers)

If you only want to preview the UI locally without connecting Notion:

```bash
pnpm install
pnpm run seed
pnpm run dev
```

---

## Docs

- [docs/DOCKER.md](./docs/DOCKER.md) — volume layout and persistence
- [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) — architecture and sync flow
- [docs/ADMIN.md](./docs/ADMIN.md) — admin behavior and credentials
- [SECURITY.md](./SECURITY.md) — threat model, operator checklist, and how to report a vulnerability

---

## Security

Before exposing a deployment publicly, work through the operator checklist in
[SECURITY.md](./SECURITY.md). The essentials: serve over **HTTPS** (`/admin` uses HTTP Basic auth),
set a strong `ADMIN_PASSWORD`, keep `NOTION_API_KEY` out of version control, and set
`PUBLIC_API_CORS_ORIGIN` to explicit origins rather than `*`.

Report vulnerabilities privately via [GitHub security advisories](https://github.com/ozantunca/notion-help-center/security/advisories/new) — not in a public issue.

---

## Credits

Inspired by [HelpKit](https://www.helpkit.so), a hosted help center solution built on Notion.

---

## Contributing

Issues and PRs are welcome. Use **pnpm** for installs and scripts (`pnpm install`, `pnpm run …`). Do not commit secrets, `package-lock.json`, or deployment-specific branding in shared defaults.

### Commit messages and releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Write commit messages (or squash-merge PR titles) as [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: …` → next **minor** version, listed under Features
- `fix: …` → next **patch** version, listed under Bug Fixes
- `feat!: …` or a `BREAKING CHANGE:` footer → next **major** version. Describe what users must do in the footer; it goes into the changelog.
- `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `style:` → no release on their own

After each merge to `master`, release-please updates an open release PR with the new version in `package.json` and `widget/package.json`, and the new `CHANGELOG.md` section. Edit that PR to add **Upgrade notes** when needed. Merging it tags the release, creates the GitHub Release and publishes the Docker image.
