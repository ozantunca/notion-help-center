import type { NextApiRequest, NextApiResponse } from 'next';
import { loadHelpMetadata, loadSearchSnapshot } from '../../lib/help-data';

/** One search hit as the browser search box needs it. No article body. */
export interface SearchIndexDocument {
  id: string;
  title: string;
  description: string;
  url: string;
  /** "Collection › Section" */
  path: string;
  suggested: boolean;
}

export interface SearchIndexPayload {
  index: object | null;
  documents: SearchIndexDocument[];
}

/**
 * Serialized lunr index for in-browser search. The index stores terms only; the
 * documents list carries titles and descriptions, not article content, so the
 * download stays small.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse<SearchIndexPayload | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const snapshot = loadSearchSnapshot();
  const { articles, collections, subCollections } = loadHelpMetadata();

  const collectionTitles = new Map(collections.map((c) => [c.id, c.title]));
  const subCollectionTitles = new Map(subCollections.map((sc) => [sc.id, sc.title]));

  const documents: SearchIndexDocument[] = articles
    .filter((a) => a.published)
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      url: a.url,
      path: [collectionTitles.get(a.collectionId), subCollectionTitles.get(a.subCollectionId)]
        .filter(Boolean)
        .join(' › '),
      suggested: a.suggested,
    }));

  // Content changes only on sync; a short cache keeps edits visible quickly.
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  return res.status(200).json({ index: snapshot?.index ?? null, documents });
}
