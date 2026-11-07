import React from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { ListSkeleton } from '../components/Skeleton';
import { useArticlesByCollection } from '../hooks/useApi';

interface Props {
  apiUrl: string;
  collectionId: string;
  onArticle: (id: string, title: string) => void;
}

export function CollectionView({ apiUrl, collectionId, onArticle }: Props) {
  const { articles, loading } = useArticlesByCollection(apiUrl, collectionId);

  if (loading) return <ListSkeleton />;
  if (articles.length === 0) return <div className="nhc-empty">No articles in this collection.</div>;

  return (
    <>
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
  );
}
