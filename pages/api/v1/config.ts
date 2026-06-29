import type { NextApiRequest, NextApiResponse } from 'next';
import { loadSiteConfig } from '../../../lib/help-data';
import { setCorsHeaders } from '../../../lib/cors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = loadSiteConfig();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ config });
  } catch (e) {
    console.error('[api/v1/config]', e);
    return res.status(500).json({ error: 'Failed to load config' });
  }
}
