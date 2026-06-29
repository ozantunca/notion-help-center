import { useState, useEffect } from 'react';

export interface Article {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  suggested: boolean;
  lastUpdated: string;
  collectionId: string;
  subCollectionId: string;
  content?: string;
  url: string;
  legacyId?: string;
}

export interface SubCollection {
  id: string;
  title: string;
  collectionId: string;
  legacyId?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  slug?: string;
  subCollections: SubCollection[];
}

export interface Config {
  brandName: string;
  logoUrl?: string;
  logoAlt: string;
  mainSiteUrl: string;
  supportEmail: string;
  theme: {
    primaryColor: string;
    primaryHoverColor: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  collectionId: string;
  subCollectionId: string;
}

function useApiCall<T>(apiUrl: string, path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${apiUrl}${path}`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, path, ...deps]);

  return { data, loading, error };
}

export function useConfig(apiUrl: string) {
  const { data, loading } = useApiCall<{ config: Config }>(apiUrl, '/api/v1/config');
  return { config: data?.config ?? null, loading };
}

export function useSuggestedArticles(apiUrl: string) {
  const { data, loading } = useApiCall<{ articles: Article[] }>(apiUrl, '/api/v1/articles?suggested=true');
  return { articles: data?.articles ?? [], loading };
}

export function useCollections(apiUrl: string) {
  const { data, loading } = useApiCall<{ collections: Collection[] }>(apiUrl, '/api/v1/collections');
  return { collections: data?.collections ?? [], loading };
}

export function useArticlesByCollection(apiUrl: string, collectionId: string) {
  const { data, loading } = useApiCall<{ articles: Article[] }>(
    apiUrl,
    `/api/v1/articles?collectionId=${encodeURIComponent(collectionId)}`,
    [collectionId],
  );
  return { articles: data?.articles ?? [], loading };
}

export function useArticle(apiUrl: string, id: string) {
  const { data, loading } = useApiCall<{ article: Article }>(
    apiUrl,
    `/api/v1/articles/${encodeURIComponent(id)}`,
    [id],
  );
  return { article: data?.article ?? null, loading };
}

export function useSearch(apiUrl: string, q: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`${apiUrl}/api/v1/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((json: { results: SearchResult[] }) => { if (!cancelled) { setResults(json.results ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) { setLoading(false); } });
    return () => { cancelled = true; };
  }, [apiUrl, q]);

  return { results, loading };
}
