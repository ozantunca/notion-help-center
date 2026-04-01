# Notion Help Center

Open-source, self-hosted help center built with **Next.js** and **SQLite**. Connect **Notion** as your CMS, or run standalone without it.

Licensed under **Apache-2.0** — see [LICENSE](./LICENSE).

**Live example:** [help.wavevisual.com](https://help.wavevisual.com)

---

## Features

- **Notion as CMS** — sync collections and articles from a Notion database
- **Full-text search** powered by Lunr (no external service)
- **Admin UI** at `/admin` — edit branding, theme, logo, and nav without touching code
- **Article feedback** — thumbs up/down stored in SQLite
- **Contact page** — Crisp live chat or Formspree form (optional)
- **Docker-ready** — persistent volumes for data and media

---

## Quickstart (no Notion)

Run locally in three commands:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy with Docker

**1. Build the image**

```bash
docker build -t notion-help-center:latest .
```

**2. Create your env file**

```bash
cp .env.example .env.local
```

Set at minimum:

```env
HELP_CENTER_URL=https://docs.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
```

To sync from Notion, also add:

```env
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
```

You'll need a Notion integration token — create one at [notion.so/my-integrations](https://www.notion.so/my-integrations) and share your database with it. See **Deploy with Notion** below.

**3. Run with persistent volumes**

```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  -v notion_help_center_data:/app/data \
  -v notion_help_center_media:/app/media \
  notion-help-center:latest
```

Or use the reference [docker-compose.example.yml](./docker-compose.example.yml).

> **Important:** Mount `/app/data` and `/app/media` as named volumes — not your repo directory. See [docs/DOCKER.md](./docs/DOCKER.md).

---

## Deploy with Notion

**1. Duplicate the Notion template**

Duplicate the [HelpKit Knowledge Base Template](https://helpkit.notion.site/HelpKit-Knowledge-Base-Academy-Template-32b504ebbf8a4a31baa2637f1ea24490) into your Notion workspace. This is the same template used by [HelpKit](https://www.helpkit.so) and is the recommended database structure.

**2. Set up a Notion integration**

- Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create an integration
- Share your duplicated database with the integration
- Copy the integration token and database ID

**3. Configure environment**

```bash
cp .env.example .env.local
```

```env
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
HELP_CENTER_URL=https://docs.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
```

**4. Sync and build**

```bash
npm run build:with-sync
npm start
```

For CI/CD or containers, use `npm run build:with-sync` so the latest Notion content is pulled before each build.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | For Notion sync | Integration token from notion.so/my-integrations |
| `NOTION_DATABASE_ID` | For Notion sync | Root database ID containing your collections |
| `HELP_CENTER_URL` | Yes | Public URL (e.g. `https://docs.example.com`) — used for sitemap and absolute links |
| `ADMIN_USERNAME` | Recommended | Enables `/admin` with HTTP Basic auth |
| `ADMIN_PASSWORD` | Recommended | Password for `/admin` |
| `HELP_CENTER_DATA_DIR` | Optional | Override SQLite directory (default: `./data`, or `/app/data` in Docker) |
| `HELP_CENTER_MEDIA_DIR` | Optional | Override media directory (default: `./public/media`, or `/app/media` in Docker) |
| `HELP_CENTER_PUBLIC_DIR` | Optional | Override writable public directory for `site-config.json` (default: `./public`) |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | Optional | Crisp chat widget ID for the contact page |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Optional | Formspree form ID for the contact page (used if Crisp is not set) |

See [`.env.example`](./.env.example) for the full template.

---

## Admin panel

With `ADMIN_USERNAME` and `ADMIN_PASSWORD` set, open `/admin` to:

- Upload or link a logo
- Edit brand colors and custom CSS
- Configure nav links

Settings are stored in SQLite and survive restarts. See [docs/ADMIN.md](./docs/ADMIN.md).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run build:with-sync` | Sync from Notion, then build |
| `npm run sync` | Fetch Notion → SQLite (dev) |
| `npm run seed` | Seed sample articles for local development (no Notion required) |
| `npm run typecheck` | TypeScript check |

---

## Development

```bash
# With Notion
cp .env.example .env.local  # fill in NOTION_API_KEY and NOTION_DATABASE_ID
npm run sync
npm run dev

# Without Notion
npm run seed
npm run dev
```

---

## Credits

Inspired by [HelpKit](https://www.helpkit.so) — a great hosted help center solution built on Notion.

---

## Contributing

Issues and PRs welcome. Do not commit secrets or deployment-specific branding in shared defaults — keep the template generic for forks.
