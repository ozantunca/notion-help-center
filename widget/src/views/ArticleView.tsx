import React from 'react';
import { useArticle } from '../hooks/useApi';

interface Props {
  apiUrl: string;
  articleId: string;
}

/**
 * The server renders the article to sanitised HTML (tables, toggles, callouts,
 * task lists), so the widget ships no markdown parser. The HTML comes from the
 * help center at `apiUrl`, the same origin that serves this widget, and the
 * server removes scripts, event handlers and unsafe URLs before sending it.
 */
export function ArticleView({ apiUrl, articleId }: Props) {
  const { article, loading } = useArticle(apiUrl, articleId);

  if (loading) return <div className="nhc-loading">Loading…</div>;
  if (!article) return <div className="nhc-empty">Article not found.</div>;

  // A help center older than this widget sends markdown only. Show the text
  // instead of an empty panel.
  if (article.contentHtml === undefined) {
    return <div className="nhc-article-content nhc-article-plain">{article.content ?? ''}</div>;
  }

  return (
    <div
      className="nhc-article-content"
      dangerouslySetInnerHTML={{ __html: article.contentHtml }}
    />
  );
}
