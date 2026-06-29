import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const tgzPath = path.join(process.cwd(), 'public', 'widget.tgz');

  if (!fs.existsSync(tgzPath)) {
    return res.status(404).json({ error: 'Widget tarball not built yet. Run pnpm build:widget.' });
  }

  const stat = fs.statSync(tgzPath);
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Content-Disposition', 'attachment; filename="notion-help-center-widget.tgz"');
  fs.createReadStream(tgzPath).pipe(res);
}
