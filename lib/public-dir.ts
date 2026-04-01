import * as fs from 'fs';
import * as path from 'path';

/**
 * Directory for JSON mirrors (`site-config.json`, `search-index.json`) and any
 * other files we write under the conventional `public/` layout.
 *
 * Default: `{cwd}/public` (matches Next.js static assets beside the app).
 *
 * Set **`HELP_CENTER_PUBLIC_DIR`** when the image has no `public/` tree (e.g.
 * `.dockerignore` excludes it): use a mounted path like `/app/public` or
 * `/app/state/public`. Next.js still serves **static files** from `./public`
 * relative to the app root—use an empty `RUN mkdir -p /app/public` in the
 * Dockerfile, or mount a **dedicated** volume on `/app/public` (never the repo).
 */
export function getHelpPublicDir(): string {
  const raw = process.env.HELP_CENTER_PUBLIC_DIR?.trim();
  if (!raw) return path.join(process.cwd(), 'public');
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

export function ensureHelpPublicDir(): void {
  const dir = getHelpPublicDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
