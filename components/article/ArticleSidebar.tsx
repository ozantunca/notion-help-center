import React from 'react';
import Link from 'next/link';
import { CollectionIcon } from '../CollectionIcon';
import type { ArticleNavSection } from '../ArticlePage';

interface ArticleSidebarProps {
  collection: { title: string; icon: string | null; href: string };
  sections: ArticleNavSection[];
  currentId: string;
}

/** Left column: every article in the current collection, grouped by section. */
export function ArticleSidebar({ collection, sections, currentId }: ArticleSidebarProps) {
  return (
    <nav aria-label={`Articles in ${collection.title}`} className="text-sm">
      <Link
        href={collection.href}
        className="mb-5 flex items-center gap-2 font-semibold text-gray-900 hover:text-primary"
      >
        <CollectionIcon
          icon={collection.icon ?? undefined}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-lg [&_img]:max-h-5 [&_img]:max-w-5"
        />
        <span className="truncate">{collection.title}</span>
      </Link>
      {sections.map((section) => (
        <div key={section.id} className="mb-5">
          <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.articles.map((article) => {
              const active = article.id === currentId;
              return (
                <li key={article.id}>
                  <Link
                    href={article.url}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-1.5 leading-snug transition-colors ${
                      active
                        ? 'bg-primary-soft font-medium text-primary'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {article.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
