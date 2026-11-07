import React from 'react';
import Link from 'next/link';

interface ArticleCardProps {
  title: string;
  description: string;
  url: string;
  variant?: 'grid' | 'list';
  /** Position in the list; staggers the entrance animation. */
  index?: number;
}

export function ArticleCard({ title, description, url, variant = 'grid', index = 0 }: ArticleCardProps) {
  const padding = variant === 'list' ? 'px-5 py-4' : 'p-5';

  return (
    <Link
      href={url}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={`group flex animate-fade-up items-center gap-4 rounded-xl border border-gray-200/70 bg-white shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-primary-ring hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-ring ${padding}`}
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors duration-300 group-hover:bg-primary-soft group-hover:text-primary"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-primary">{title}</h3>
        {description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{description}</p>}
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
  );
}
