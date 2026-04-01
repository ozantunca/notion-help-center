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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as FeedbackBody;

    if (!body?.articleId || typeof body.articleId !== 'string') {
      return res.status(400).json({ error: 'articleId is required' });
    }

    if (!isValidRating(body.rating)) {
      return res
        .status(400)
        .json({ error: 'rating must be positive, neutral, or negative' });
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
