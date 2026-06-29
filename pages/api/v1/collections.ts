import type { NextApiRequest, NextApiResponse } from 'next';
import { loadHelpMetadata } from '../../../lib/help-data';
import type { Collection, SubCollection } from '../../../lib/types';
import { setCorsHeaders } from '../../../lib/cors';

interface CollectionWithSubs extends Collection {
  subCollections: SubCollection[];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { collections, subCollections } = loadHelpMetadata();

    const result: CollectionWithSubs[] = collections.map((c) => ({
      ...c,
      subCollections: subCollections.filter((s) => s.collectionId === c.id),
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ collections: result });
  } catch (e) {
    console.error('[api/v1/collections]', e);
    return res.status(500).json({ error: 'Failed to load collections' });
  }
}
