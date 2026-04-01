import * as crypto from 'crypto';
import * as path from 'path';
import { URL } from 'url';
import { downloadMedia } from './media';
import { normalizeSiteConfig, type SiteConfig } from './site-config';

function logoFilenameForUrl(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 14);
  let ext = '.png';
  try {
    const p = new URL(url).pathname;
    const e = path.extname(p);
    if (e && e.length <= 8) ext = e;
  } catch {
    /* keep default */
  }
  return `site-logo-${hash}${ext}`;
}

/** If `logoUrl` is http(s), download into `getHelpMediaDir()` and return `/media/...`. */
export async function rehostRemoteLogoUrl(
  logoUrl: string | undefined,
): Promise<string | undefined> {
  if (!logoUrl || !/^https?:\/\//i.test(logoUrl.trim())) return logoUrl;
  const url = logoUrl.trim();
  try {
    const filename = logoFilenameForUrl(url);
    return await downloadMedia(url, filename, { overwrite: true });
  } catch (e) {
    console.warn('[site-config] Failed to download remote logo URL, keeping original:', e);
    return logoUrl;
  }
}

/** After Notion sync: keep saved site config, rehost remote logo if present. */
export async function finalizeSiteConfigFromDisk(
  diskRaw: Record<string, unknown> | null,
): Promise<SiteConfig> {
  let config = normalizeSiteConfig(diskRaw ?? {});
  const nextLogo = await rehostRemoteLogoUrl(config.logoUrl);
  if (nextLogo !== config.logoUrl) {
    config = { ...config, logoUrl: nextLogo };
  }
  return config;
}
