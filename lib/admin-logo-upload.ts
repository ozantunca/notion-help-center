import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ensureMediaDir } from './media';
import { getHelpMediaDir } from './media-dir';

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const ALLOWED_MIMES = new Set(Object.keys(MIME_TO_EXT));

/** Max decoded file size (bytes). */
const DEFAULT_MAX = 2 * 1024 * 1024;

/**
 * Save a data-URL image from the admin UI under `getHelpMediaDir()`.
 * Returns `/media/...` path or an error message.
 */
export function saveAdminLogoFromDataUrl(
  dataUrl: string,
  maxBytes: number = DEFAULT_MAX,
): { url: string } | { error: string } {
  const trimmed = dataUrl.trim();
  const m = trimmed.match(/^data:(image\/[a-z0-9.+@-]+);base64,([\s\S]*)$/i);
  if (!m) {
    return { error: 'Expected a base64 data URL (e.g. data:image/png;base64,...)' };
  }
  const mime = m[1].toLowerCase();
  if (!ALLOWED_MIMES.has(mime)) {
    return { error: 'Use PNG, JPEG, GIF, WebP, or SVG' };
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(m[2].replace(/\s/g, ''), 'base64');
  } catch {
    return { error: 'Invalid base64 payload' };
  }
  if (buf.length === 0) {
    return { error: 'Empty file' };
  }
  if (buf.length > maxBytes) {
    return { error: `Image must be at most ${Math.round(maxBytes / (1024 * 1024))} MB` };
  }

  const ext = MIME_TO_EXT[mime];
  const name = `admin-logo-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  ensureMediaDir();
  const filePath = path.join(getHelpMediaDir(), name);
  fs.writeFileSync(filePath, buf);
  return { url: `/media/${name}` };
}
