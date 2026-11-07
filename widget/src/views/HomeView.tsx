import React from 'react';
import { ArticleCard, Chevron } from '../components/ArticleCard';
import { ListSkeleton } from '../components/Skeleton';
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
        <ListSkeleton />
      ) : articles.length > 0 ? (
        <>
          <div className="nhc-section-title">Suggested articles</div>
          {articles.map((a, i) => (
            <ArticleCard
              key={a.id}
              index={i}
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
          {collections.map((c, i) => (
            <button
              key={c.id}
              className="nhc-collection-card"
              onClick={() => onCollection(c.id, c.title)}
              style={{ '--nhc-i': Math.min(articles.length + i, 10) } as React.CSSProperties}
            >
              {c.icon && <span className="nhc-collection-icon">{c.icon}</span>}
              <span className="nhc-collection-name">{c.title}</span>
              <Chevron />
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
