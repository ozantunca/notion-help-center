import path from 'path';

/**
 * Directory for SQLite + `metadata.json`.
 * Set `HELP_CENTER_DATA_DIR` when the DB is not under `process.cwd()/data` (common in Docker).
 * Absolute paths are used as-is; relative paths are resolved from `process.cwd()`.
 */
export function getHelpDataDir(): string {
  const raw = process.env.HELP_CENTER_DATA_DIR?.trim();
  if (!raw) return path.join(process.cwd(), 'data');
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}
