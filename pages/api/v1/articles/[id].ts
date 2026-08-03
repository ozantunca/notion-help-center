import type { NextApiRequest, NextApiResponse } from 'next';
import { loadHelpMetadata } from '../../../../lib/help-data';
import { setCorsHeaders } from '../../../../lib/cors';
import { absolutizeMediaUrlsInContent } from '../../../../lib/media';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const { articles } = loadHelpMetadata();
    const article = articles.find(
      (a) => (a.id === id || a.legacyId === id) && a.published,
    );

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      article: { ...article, content: absolutizeMediaUrlsInContent(article.content) },
    });
  } catch (e) {
    console.error('[api/v1/articles/[id]]', e);
    return res.status(500).json({ error: 'Failed to load article' });
  }
}
