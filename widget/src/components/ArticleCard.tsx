import React from 'react';

interface Props {
  title: string;
  description: string;
  onClick: () => void;
  /** Position in the list; staggers the entrance animation. */
  index?: number;
}

export function ArticleCard({ title, description, onClick, index = 0 }: Props) {
  return (
    <button
      className="nhc-article-card"
      onClick={onClick}
      style={{ '--nhc-i': Math.min(index, 10) } as React.CSSProperties}
    >
      <span className="nhc-article-card-text">
        <span className="nhc-article-card-title">{title}</span>
        {description && <span className="nhc-article-card-desc">{description}</span>}
      </span>
      <Chevron />
    </button>
  );
}

export function Chevron() {
  return (
    <svg className="nhc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
