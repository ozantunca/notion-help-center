import React from 'react';
import Link from 'next/link';

interface ArticleCardProps {
  title: string;
  description: string;
  url: string;
  variant?: 'grid' | 'list';
}

export function ArticleCard({ title, description, url, variant = 'grid' }: ArticleCardProps) {
  const baseClasses =
    'block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200';

  const listClasses = variant === 'list' ? 'bg-gray-50/80' : '';

  return (
    <Link href={url} className={`${baseClasses} ${listClasses}`}>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
      )}
    </Link>
  );
}
