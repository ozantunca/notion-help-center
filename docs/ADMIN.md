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
- **Logo** — upload a file (PNG, JPEG, GIF, WebP, SVG up to 2 MB) or paste a URL/path; remote `http(s)` URLs are downloaded into the media directory on save (default `/app/media` when the app runs from `/app`, else `public/media`, or `HELP_CENTER_MEDIA_DIR`) and served at `/media/…`. Downloads follow at most 5 redirects, must stay on `http(s)`, and are capped at 25 MB / 20 s. If a download fails or exceeds a limit, the save still succeeds and the config **keeps the remote URL as-is** (a warning is logged) — the logo then loads from the third-party host instead of your `/media` directory, so it will break if that host goes away. Files under `/media/*` are served with a `sandbox` CSP, so an uploaded SVG renders normally in `<img>` but cannot run script.

### Logos and redeploys (Docker / PaaS)

The **logo file** is stored on disk under **`getHelpMediaDir()`** (default **`/app/media`** when `cwd` is **`/app`**, else **`{cwd}/public/media`**, unless **`HELP_CENTER_MEDIA_DIR`** is set). **SQLite** keeps `logoUrl` (e.g. `/media/admin-logo-….png`), but if that directory is **ephemeral**, the file is gone after each deploy and the image 404s.

**Fix:** mount a **named volume** on **`/app/media`** in Docker (or set **`HELP_CENTER_MEDIA_DIR`** to another mounted path). In **production**, `/admin` shows an amber notice with the resolved absolute path.

See **[DOCKER.md](./DOCKER.md)** and the Deployment section in **README.md**.
- **Theme** — each color has a live preview, a native color picker (hex), and a text field for CSS colors and gradients.

  Theme values are rendered into an inline `<style>` tag, so they are validated before use: hex, `rgb()`, `hsl()`, colour keywords, and `linear-gradient(...)` all work, but a value containing `url(`, `expression(`, or characters outside `A-Z a-z 0-9 # ( ) , . % _ - space` is **silently replaced with the default** for that token (max 200 characters). If a colour you typed does not take effect, this is why.
- **Header / footer links** — row editor (label, URL, “open in new tab”); no raw JSON required.

  Link URLs must be `http:`, `https:`, `mailto:`, `tel:`, or a root-relative path (`/contact`). Other schemes — notably `javascript:` and `data:` — are **dropped on save**, and a row whose URL is rejected disappears from the list. If every link in a list is rejected, the built-in defaults are restored.

## Security notes

- Use a **strong password** and HTTPS in production (Basic sends credentials Base64-encoded; TLS is required).
- There is no rate limiting or account lockout on the admin API; put the app behind a reverse proxy or VPN if needed.
- Credentials are compared in **constant time**, so a wrong password cannot be narrowed down by timing the response.
- `POST /api/admin/*` requires **`Content-Type: application/json`** and returns **415** otherwise. Browsers replay cached Basic credentials automatically, so this blocks a cross-origin HTML form from driving the admin API (a plain form cannot send that content type). Scripted clients must set the header — the admin UI already does.
- The admin UI is marked `noindex` for crawlers.

See **[SECURITY.md](../SECURITY.md)** for the full threat model and operator checklist.

## Sync

`pnpm run sync` **does not** change site settings from Notion; it **keeps** the current DB/file config and only re-downloads a remote logo URL if the saved config still points at `http(s)`.
