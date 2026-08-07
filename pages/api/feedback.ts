import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';

type Rating = 'positive' | 'neutral' | 'negative';

interface FeedbackBody {
  articleId: string;
  rating: Rating;
  comment?: string;
}

function isValidRating(r: unknown): r is Rating {
  return r === 'positive' || r === 'neutral' || r === 'negative';
}

/** This endpoint is unauthenticated and writes to disk, so both inputs are bounded. */
const MAX_ARTICLE_ID_LENGTH = 200;
const MAX_COMMENT_LENGTH = 2000;

/**
 * Coarse per-IP throttle so an anonymous client cannot grow the SQLite file
 * without limit. In-process only — behind multiple instances, put a real rate
 * limiter in the proxy as well (see SECURITY.md).
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (first?.split(',')[0].trim() || req.socket.remoteAddress) ?? 'unknown';
}

function isRateLimited(req: NextApiRequest): boolean {
  const now = Date.now();
  const key = clientKey(req);

  // Opportunistic sweep keeps the map from growing with one-off IPs.
  if (rateLimitBuckets.size > 10_000) {
    for (const [k, v] of rateLimitBuckets) {
      if (v.resetAt <= now) rateLimitBuckets.delete(k);
    }
  }

  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req)) {
    res.setHeader('Retry-After', String(RATE_LIMIT_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const body = req.body as FeedbackBody;

    if (!body?.articleId || typeof body.articleId !== 'string') {
      return res.status(400).json({ error: 'articleId is required' });
    }

    if (body.articleId.length > MAX_ARTICLE_ID_LENGTH) {
      return res.status(400).json({ error: 'articleId is too long' });
    }

    if (!isValidRating(body.rating)) {
      return res
        .status(400)
        .json({ error: 'rating must be positive, neutral, or negative' });
    }

    if (body.comment !== undefined && typeof body.comment !== 'string') {
      return res.status(400).json({ error: 'comment must be a string' });
    }

    if (typeof body.comment === 'string' && body.comment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: 'comment is too long' });
    }

    const comment =
      typeof body.comment === 'string' ? body.comment.trim() : undefined;

    const database = getDb();
    database
      .prepare(
        `INSERT INTO article_feedback (article_id, rating, comment)
         VALUES (?, ?, ?)`,
      )
      .run(body.articleId, body.rating, comment ?? null);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Feedback API error:', err);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
}
