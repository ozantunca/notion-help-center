import React from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { useSearch } from '../hooks/useApi';

interface Props {
  apiUrl: string;
  query: string;
  onArticle: (id: string, title: string) => void;
}

export function SearchView({ apiUrl, query, onArticle }: Props) {
  const { results, loading } = useSearch(apiUrl, query);

  if (!query.trim()) return null;
  if (loading) return <div className="nhc-loading">Searching…</div>;
  if (results.length === 0) return <div className="nhc-empty">No results for "{query}".</div>;

  return (
    <>
      {results.map((r) => (
        <ArticleCard
          key={r.id}
          title={r.title}
          description={r.description}
          onClick={() => onArticle(r.id, r.title)}
        />
      ))}
    </>
  );
}
