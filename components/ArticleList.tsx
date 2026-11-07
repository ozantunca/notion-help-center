import React from 'react';
import Link from 'next/link';

export interface ArticleListItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  /** Small line above the title, e.g. "Collection › Section". */
  eyebrow?: string;
}

/** Compact, divided list of article links inside one card. */
export function ArticleList({ articles }: { articles: ArticleListItem[] }) {
  return (
    <ul className="animate-fade-up divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-card">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={article.url}
            className="group relative flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-gray-50/80 focus-visible:bg-gray-50 focus-visible:outline-none before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:origin-center before:scale-y-0 before:rounded-r-full before:bg-primary before:transition-transform before:duration-300 before:ease-out-expo hover:before:scale-y-100 focus-visible:before:scale-y-100"
          >
            <div className="min-w-0 flex-1">
              {article.eyebrow && (
                <p className="mb-0.5 text-xs text-gray-400">{article.eyebrow}</p>
              )}
              <p className="font-semibold text-gray-900 transition-colors group-hover:text-primary">
                {article.title}
              </p>
              {article.description && (
                <p className="mt-0.5 truncate text-sm text-gray-500">{article.description}</p>
              )}
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-gray-300 transition-all duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
