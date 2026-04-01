import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyBasicAuthHeader } from '../../../lib/admin-auth';
import { saveAdminLogoFromDataUrl } from '../../../lib/admin-logo-upload';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2.5mb',
    },
  },
};

function unauthorized(res: NextApiResponse) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).end('Authentication required');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyBasicAuthHeader(req.headers.authorization)) {
    return unauthorized(res);
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const body = req.body as { dataUrl?: string };
  if (typeof body?.dataUrl !== 'string') {
    return res.status(400).json({ error: 'Missing dataUrl' });
  }

  const result = saveAdminLogoFromDataUrl(body.dataUrl);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }
  return res.status(200).json({ url: result.url });
}
