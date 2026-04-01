import path from 'path';

/** When the app runs with `WORKDIR /app` (typical Docker), media lives here unless overridden. */
export const DOCKER_DEFAULT_MEDIA_DIR = '/app/media';

/**
 * Directory for uploaded and synced assets served at `/media/*`.
 *
 * Resolution:
 * 1. `HELP_CENTER_MEDIA_DIR` if set (absolute or relative to `cwd`).
 * 2. Else if `process.cwd()` is `/app` → `/app/media` (mount your volume here).
 * 3. Else → `{cwd}/public/media` (local dev).
 */
export function getHelpMediaDir(): string {
  const raw = process.env.HELP_CENTER_MEDIA_DIR?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  }
  if (process.cwd() === '/app') {
    return DOCKER_DEFAULT_MEDIA_DIR;
  }
  return path.join(process.cwd(), 'public', 'media');
}
