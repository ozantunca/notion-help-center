import type { NextApiRequest, NextApiResponse } from 'next';
import lunr from 'lunr';
import { loadHelpMetadata, loadSearchSnapshot } from '../../../lib/help-data';
import type { SearchDocument } from '../../../lib/search-index';
import { setCorsHeaders } from '../../../lib/cors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  if (typeof q !== 'string' || q.trim() === '') {
    return res.status(400).json({ error: 'q query parameter is required' });
  }

  try {
    const snapshot = loadSearchSnapshot();
    if (!snapshot) {
      return res.status(200).json({ results: [] });
    }

    const { articles } = loadHelpMetadata();
    const publishedIds = new Set(articles.filter((a) => a.published).map((a) => a.id));

    const idx = lunr.Index.load(snapshot.index);
    const docMap = new Map<string, SearchDocument>(
      snapshot.documents.map((d) => [d.id, d]),
    );

    let matches: lunr.Index.Result[];
    try {
      matches = idx.search(q.trim());
    } catch {
      matches = [];
    }

    const results = matches
      .map((m) => docMap.get(m.ref))
      .filter((d): d is SearchDocument => d != null && publishedIds.has(d.id));

    return res.status(200).json({ results });
  } catch (e) {
    console.error('[api/v1/search]', e);
    return res.status(500).json({ error: 'Search failed' });
  }
}
