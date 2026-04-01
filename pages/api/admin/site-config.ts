import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyBasicAuthHeader } from '../../../lib/admin-auth';
import { loadSiteConfig, saveSiteConfigOnly } from '../../../lib/help-data';
import { normalizeSiteConfig, type SiteConfig } from '../../../lib/site-config';
import { rehostRemoteLogoUrl } from '../../../lib/site-config-env';

function unauthorized(res: NextApiResponse) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).end('Authentication required');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyBasicAuthHeader(req.headers.authorization)) {
    return unauthorized(res);
  }

  if (req.method === 'GET') {
    return res.status(200).json(loadSiteConfig());
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  }

  try {
    const body = req.body as unknown;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Expected JSON object body' });
    }
    let config: SiteConfig = normalizeSiteConfig(body);
    const nextLogo = await rehostRemoteLogoUrl(config.logoUrl);
    if (nextLogo !== config.logoUrl) {
      config = { ...config, logoUrl: nextLogo };
    }
    saveSiteConfigOnly(config);
    return res.status(200).json({ ok: true, siteConfig: config });
  } catch (e) {
    console.error('[api/admin/site-config]', e);
    return res.status(400).json({ error: 'Could not save settings' });
  }
}
