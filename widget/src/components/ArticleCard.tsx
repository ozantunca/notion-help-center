import React from 'react';

interface Props {
  title: string;
  description: string;
  onClick: () => void;
}

export function ArticleCard({ title, description, onClick }: Props) {
  return (
    <button className="nhc-article-card" onClick={onClick}>
      <div className="nhc-article-card-title">{title}</div>
      {description && <div className="nhc-article-card-desc">{description}</div>}
    </button>
  );
}
