import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { getSchemaVersion } from '../../lib/db-migrations';
import { APP_VERSION } from '../../lib/version';

/**
 * Liveness check for Docker / load balancers. Opens the database, so a broken
 * volume or a failed migration reports 503 instead of a healthy container.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const schemaVersion = getSchemaVersion(getDb());
    return res.status(200).json({ status: 'ok', version: APP_VERSION, schemaVersion });
  } catch (e) {
    console.error('[api/health]', e);
    return res.status(503).json({ status: 'error', version: APP_VERSION });
  }
}
