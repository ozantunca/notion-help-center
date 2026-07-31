import type { NextApiRequest, NextApiResponse } from 'next';

function parseAllowedOrigins(): string[] {
  const raw = process.env.PUBLIC_API_CORS_ORIGIN?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse): void {
  if (allowedOrigins.length === 0) return;

  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return;
  }

  const requestOrigin = req.headers.origin;
  if (typeof requestOrigin !== 'string' || !allowedOrigins.includes(requestOrigin)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}
