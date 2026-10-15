import React from 'react';
import Link from 'next/link';

export interface ArticleListItem {
  id: string;
  title: string;
  description?: string;
  url: string;
}

/** Compact, divided list of article links inside one card. */
export function ArticleList({ articles }: { articles: ArticleListItem[] }) {
  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={article.url}
            className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-primary">
                {article.title}
              </p>
              {article.description && (
                <p className="mt-0.5 truncate text-sm text-gray-500">{article.description}</p>
              )}
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
