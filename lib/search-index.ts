import lunr from 'lunr';
import { Article } from './types';

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  content?: string;
  collectionId: string;
  subCollectionId: string;
  url: string;
}

/**
 * Generate search index from articles
 */
export function generateSearchIndex(
  articles: Article[],
  contentMap?: Map<string, string>,
): any {
  const documents: SearchDocument[] = articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    content: contentMap?.get(article.id) || '',
    collectionId: article.collectionId,
    subCollectionId: article.subCollectionId,
    url: article.url,
  }));

  const index = lunr(function () {
    this.ref('id');
    this.field('title', { boost: 10 });
    this.field('description', { boost: 5 });
    this.field('content', { boost: 1 });

    documents.forEach((doc) => {
      this.add(doc);
    });
  });

  return {
    index: index.toJSON(),
    documents,
  };
}

