import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import { getHelpMediaDir } from '../../../lib/media-dir';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function segmentsFromQuery(
  pathParam: string | string[] | undefined,
): string[] {
  if (pathParam == null) return [];
  const parts = Array.isArray(pathParam) ? pathParam : [pathParam];
  return parts
    .flatMap((p) => p.split('/'))
    .filter((s) => s.length > 0);
}

function safeResolvedFile(root: string, segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const s of segments) {
    if (s === '' || s === '.' || s === '..' || s.includes('/') || s.includes('\\')) {
      return null;
    }
  }
  const rootResolved = path.resolve(root);
  const filePath = path.resolve(rootResolved, ...segments);
  const rel = path.relative(rootResolved, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return filePath;
}

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end();
    return;
  }

  const segments = segmentsFromQuery(req.query.path);
  const root = getHelpMediaDir();
  const filePath = safeResolvedFile(root, segments);

  if (!filePath) {
    res.status(400).end();
    return;
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.status(404).end();
    return;
  }

  if (!stat.isFile()) {
    res.status(404).end();
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (req.method === 'HEAD') {
    res.setHeader('Content-Length', String(stat.size));
    res.status(200).end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
