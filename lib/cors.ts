import type { NextApiResponse } from 'next';

export function setCorsHeaders(res: NextApiResponse): void {
  const origin = process.env.PUBLIC_API_CORS_ORIGIN;
  if (!origin) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
