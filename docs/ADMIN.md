# Admin UI (Notion Help Center)

Site branding, navigation links, SEO defaults, and theme are edited at **`/admin`** when credentials are configured.

## Environment

| Variable | Purpose |
|----------|---------|
| `ADMIN_USERNAME` | HTTP Basic auth username (non-empty) |
| `ADMIN_PASSWORD` | HTTP Basic auth password (non-empty) |

If either is missing, `/admin` and `/api/admin/*` return **503** with a short message (admin is disabled).

## Behavior

- The browser shows the standard **Basic** login prompt when you open `/admin`.
- **Save** writes to SQLite (`site_config` row) and `public/site-config.json`.
- **Logo** — upload a file (PNG, JPEG, GIF, WebP, SVG up to 2 MB) or paste a URL/path; remote `http(s)` URLs are downloaded into the media directory on save (default `/app/media` when the app runs from `/app`, else `public/media`, or `HELP_CENTER_MEDIA_DIR`) and served at `/media/…`.

### Logos and redeploys (Docker / PaaS)

The **logo file** is stored on disk under **`getHelpMediaDir()`** (default **`/app/media`** when `cwd` is **`/app`**, else **`{cwd}/public/media`**, unless **`HELP_CENTER_MEDIA_DIR`** is set). **SQLite** keeps `logoUrl` (e.g. `/media/admin-logo-….png`), but if that directory is **ephemeral**, the file is gone after each deploy and the image 404s.

**Fix:** mount a **named volume** on **`/app/media`** in Docker (or set **`HELP_CENTER_MEDIA_DIR`** to another mounted path). In **production**, `/admin` shows an amber notice with the resolved absolute path.

See **[DOCKER.md](./DOCKER.md)** and the Deployment section in **README.md**.
- **Theme** — each color has a live preview, a native color picker (hex), and a text field for any CSS color or gradient.
- **Header / footer links** — row editor (label, URL, “open in new tab”); no raw JSON required.

## Security notes

- Use a **strong password** and HTTPS in production (Basic sends credentials Base64-encoded; TLS is required).
- There is no rate limiting on the admin API; put the app behind a reverse proxy or VPN if needed.
- The admin UI is marked `noindex` for crawlers.

## Sync

`npm run sync` **does not** change site settings from Notion; it **keeps** the current DB/file config and only re-downloads a remote logo URL if the saved config still points at `http(s)`.
