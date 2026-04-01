import React from 'react';
import Link from 'next/link';
import { CollectionIcon } from './CollectionIcon';

interface CategoryCardProps {
  id: string;
  title: string;
  description: string;
  articleCount: number;
  icon?: string;
}

export function CategoryCard({
  id,
  title,
  description,
  articleCount,
  icon,
}: CategoryCardProps) {
  return (
    <Link
      href={`/collection/${id}`}
      className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
    >
      <CollectionIcon icon={icon} />
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
      <p className="text-sm text-gray-500 font-medium">{articleCount} Articles</p>
    </Link>
  );
}
