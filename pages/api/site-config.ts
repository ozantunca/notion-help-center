import type { NextApiRequest, NextApiResponse } from 'next';
import { loadSiteConfig } from '../../lib/help-data';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = loadSiteConfig();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(config);
  } catch (e) {
    console.error('[api/site-config]', e);
    res.status(500).json({ error: 'Failed to load site config' });
  }
}
