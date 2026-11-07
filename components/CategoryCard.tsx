import React from 'react';
import Link from 'next/link';
import { CollectionIcon } from './CollectionIcon';

interface CategoryCardProps {
  id: string;
  title: string;
  description: string;
  articleCount: number;
  icon?: string;
  /** Position in the grid; staggers the entrance animation. */
  index?: number;
}

export function CategoryCard({
  id,
  title,
  description,
  articleCount,
  icon,
  index = 0,
}: CategoryCardProps) {
  return (
    <Link
      href={`/collection/${id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="group relative flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-6 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-primary-ring hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
    >
      {/* Soft tint that fades in from the top-right corner on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-soft opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <CollectionIcon
        icon={icon}
        className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-3xl ring-1 ring-inset ring-primary-soft transition-transform duration-300 ease-spring group-hover:-rotate-6 group-hover:scale-110 [&_img]:max-h-9 [&_img]:max-w-9"
      />
      <h3 className="relative mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="relative mb-5 line-clamp-2 text-sm text-gray-600">{description}</p>
      <div className="relative mt-auto flex items-center justify-between text-sm font-medium">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600 transition-colors group-hover:bg-primary-soft group-hover:text-primary">
          {articleCount} {articleCount === 1 ? 'article' : 'articles'}
        </span>
        <svg
          className="h-5 w-5 -translate-x-2 text-primary opacity-0 transition-all duration-300 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </Link>
  );
}
