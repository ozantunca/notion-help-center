import type { NextApiRequest, NextApiResponse } from 'next';
import { loadHelpMetadata } from '../../../../lib/help-data';
import type { Article } from '../../../../lib/types';
import { setCorsHeaders } from '../../../../lib/cors';

type ArticleMetadata = Omit<Article, 'content'>;

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
    const { articles } = loadHelpMetadata();

    let result = articles.filter((a) => a.published);

    const { collectionId, suggested } = req.query;

    if (typeof collectionId === 'string') {
      result = result.filter((a) => a.collectionId === collectionId);
    }

    if (suggested === 'true') {
      result = result.filter((a) => a.suggested);
    }

    const metadata: ArticleMetadata[] = result.map(({ content: _content, ...rest }) => rest);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ articles: metadata });
  } catch (e) {
    console.error('[api/v1/articles]', e);
    return res.status(500).json({ error: 'Failed to load articles' });
  }
}
