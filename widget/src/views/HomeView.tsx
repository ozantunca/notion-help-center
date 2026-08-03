import React from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { useSuggestedArticles, useCollections } from '../hooks/useApi';

interface Props {
  apiUrl: string;
  onArticle: (id: string, title: string) => void;
  onCollection: (id: string, name: string) => void;
}

export function HomeView({ apiUrl, onArticle, onCollection }: Props) {
  const { articles, loading: articlesLoading } = useSuggestedArticles(apiUrl);
  const { collections, loading: collectionsLoading } = useCollections(apiUrl);

  return (
    <>
      {articlesLoading ? (
        <div className="nhc-loading">Loading…</div>
      ) : articles.length > 0 ? (
        <>
          <div className="nhc-section-title">Suggested articles</div>
          {articles.map((a) => (
            <ArticleCard
              key={a.id}
              title={a.title}
              description={a.description}
              onClick={() => onArticle(a.id, a.title)}
            />
          ))}
        </>
      ) : null}

      {!collectionsLoading && collections.length > 0 && (
        <>
          <div className="nhc-section-title">Browse by topic</div>
          {collections.map((c) => (
            <button
              key={c.id}
              className="nhc-collection-card"
              onClick={() => onCollection(c.id, c.title)}
            >
              {c.icon && <span className="nhc-collection-icon">{c.icon}</span>}
              <span className="nhc-collection-name">{c.title}</span>
            </button>
          ))}
        </>
      )}

      {!articlesLoading && !collectionsLoading && articles.length === 0 && collections.length === 0 && (
        <div className="nhc-empty">No articles found.</div>
      )}
    </>
  );
}
