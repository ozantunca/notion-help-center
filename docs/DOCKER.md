# Docker and volume layout

**`/media/*`** is served by the app (rewrite → **`/api/media`**). With **`WORKDIR /app`**, files are stored under **`/app/media`** by default (override with **`HELP_CENTER_MEDIA_DIR`**).

Next.js still serves **other** files from **`./public`** relative to the app root (e.g. favicon). If you replace that directory with the wrong bind mount, you can accidentally **publish your repository** (e.g. **`/docker-compose.yaml`**).

## What went wrong (symptoms)

- You can open URLs like **`/docker-compose.yaml`**, **`/package.json`**, or other repo files.
- **`/media/...`** images return **404** or never update as expected.

Usually the cause is a volume that maps **too much** onto **`/app/public`**, for example:

```yaml
# ❌ NEVER — exposes the whole project at /
volumes:
  - .:/app/public
```

or Coolify / another UI where “persist public” is implemented as mounting the **application / git checkout directory** onto **`public`**.

## Correct approach

**Do not** bind-mount the entire `public` folder from your laptop or from the repo root unless that directory is **only** the same shape as runtime `public/` (not the whole project).

Use **named volumes** or **narrow bind mounts**:

| Mount | Purpose |
|--------|---------|
| **`/app/data`** | SQLite (`help-center.db`), optional `metadata.json`. Set **`HELP_CENTER_DATA_DIR`** if you mount elsewhere. |
| **`/app/media`** | **Default** media directory when **`WORKDIR`** / `cwd` is **`/app`** (no env required). Admin logos, Notion images, collection icons. Mount a **named volume** here or files vanish on redeploy. Override with **`HELP_CENTER_MEDIA_DIR`** if needed. |
| **`/app/public`** (optional empty volume) | JSON mirrors **`site-config.json`** and **`search-index.json`**, plus any static assets Next reads from **`public/`**. Set **`HELP_CENTER_PUBLIC_DIR=/app/public`** if that path differs from default (default is **`{cwd}/public`**). The app **creates** this directory on first sync/admin save if missing. |

Leave the **application source and `.next` build** **inside the image** — never replace **`/app`** with your git checkout in production.

### Example `docker-compose`

See **[docker-compose.example.yml](../docker-compose.example.yml)** in the repo root.

### No `public/` tree in the image (e.g. `.dockerignore`)

If the build context **excludes** `public/`:

1. Mount a volume on **`/app/media`** (default media directory when **`cwd`** is **`/app`**).
2. For JSON mirrors and Next static files from `public/`, either:
   - add **`RUN mkdir -p /app/public`** in the Dockerfile and mount **`notion_help_center_public:/app/public`** so the directory is writable and matches **`HELP_CENTER_PUBLIC_DIR`** default, or  
   - set **`HELP_CENTER_PUBLIC_DIR`** to another mounted path (note: Next only serves **static** URLs like **`/search-index.json`** from **`./public`** next to the app — keep mirrors under **`/app/public`** unless you only rely on SQLite for search/config).

Branding and search still work from **SQLite** if JSON files are missing; mirrors are optional for tooling and static fetches.

### `site-config.json` and `search-index.json`

Written under **`getHelpPublicDir()`** (default **`public/`**, override with **`HELP_CENTER_PUBLIC_DIR`**). They are also stored in SQLite / the DB where applicable.

## Checklist

1. **`data/`** (or **`HELP_CENTER_DATA_DIR`**) is on a persistent volume.
2. **`/app/media`** on a persistent volume (default when **`WORKDIR /app`**) — **not** the repo root.
3. **`/app/public`** is **not** overlaid by `.` or your git checkout. Use an **empty named volume** on **`/app/public`** if you need writable JSON mirrors alongside a minimal image.

After fixing mounts, **redeploy**.
