import React from 'react';
import Markdown from 'react-markdown';
import { useArticle } from '../hooks/useApi';

interface Props {
  apiUrl: string;
  articleId: string;
}

export function ArticleView({ apiUrl, articleId }: Props) {
  const { article, loading } = useArticle(apiUrl, articleId);

  if (loading) return <div className="nhc-loading">Loading…</div>;
  if (!article) return <div className="nhc-empty">Article not found.</div>;

  return (
    <div className="nhc-article-content">
      <Markdown>{article.content ?? ''}</Markdown>
    </div>
  );
}
