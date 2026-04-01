import { Article, Collection, SubCollection } from './types';

/**
 * Slugify a string for URL use (lowercase, replace spaces with hyphens, remove non-alphanumeric).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/**
 * Build the canonical article URL path.
 * Format: /{collectionSlug}/{categoryId}/{articleSlug}/{articleId}
 * Uses legacyId when present for backward compatibility with existing links.
 */
export function getArticlePath(
  article: Article,
  collection: Collection,
  subCollection: SubCollection,
): string {
  const collectionSlug =
    collection.slug || slugify(collection.title);
  const categoryId = subCollection.legacyId || subCollection.id;
  const articleId = article.legacyId || article.id;
  return `/${collectionSlug}/${categoryId}/${article.slug}/${articleId}`;
}
