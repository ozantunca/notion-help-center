import type { NextApiRequest, NextApiResponse } from 'next';
import { hasJsonContentType, verifyBasicAuthHeader } from '../../../lib/admin-auth';
import { getDb } from '../../../lib/db';
import { getSyncStatus, hasNotionCredentials, startSync, type SyncStatus } from '../../../lib/sync-runner';

export interface AdminSyncResponse extends SyncStatus {
  /** Time of the last successful sync, from the database (survives restarts). */
  lastSynced: string | null;
  configured: boolean;
}

function unauthorized(res: NextApiResponse) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).end('Authentication required');
}

function readLastSynced(): string | null {
  const row = getDb().prepare(`SELECT value FROM sync_meta WHERE key = 'last_synced'`).get() as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

function statusBody(): AdminSyncResponse {
  return { ...getSyncStatus(), lastSynced: readLastSynced(), configured: hasNotionCredentials() };
}

/**
 * GET: sync status. POST: start a Notion sync now (runs in the background;
 * poll GET for the result).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyBasicAuthHeader(req.headers.authorization)) {
    return unauthorized(res);
  }
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json(statusBody());
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  }

  // Same CSRF guard as the other admin writes (see hasJsonContentType).
  if (!hasJsonContentType(req.headers['content-type'])) {
    return res.status(415).json({ error: 'Expected Content-Type: application/json' });
  }
  if (!hasNotionCredentials()) {
    return res.status(400).json({ error: 'Set NOTION_API_KEY and NOTION_DATABASE_ID to sync from Notion.' });
  }
  if (!startSync('admin')) {
    return res.status(409).json({ ...statusBody(), message: 'A sync is already running.' });
  }
  return res.status(202).json(statusBody());
}
