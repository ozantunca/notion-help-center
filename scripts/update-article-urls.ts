/**
 * One-time script: update article URLs in metadata.json to the new canonical format
 * /{collectionSlug}/{categoryId}/{articleSlug}/{articleId}
 * Run: npx tsx scripts/update-article-urls.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { getArticlePath } from '../lib/article-url';
import type { Article, Collection, SubCollection } from '../lib/types';
import { getHelpDataDir } from '../lib/data-dir';

const METADATA_FILE = path.join(getHelpDataDir(), 'metadata.json');

function main() {
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('metadata.json not found');
    process.exit(1);
  }

  const raw = fs.readFileSync(METADATA_FILE, 'utf-8');
  const metadata = JSON.parse(raw) as {
    collections: Collection[];
    subCollections: SubCollection[];
    articles: Article[];
  };

  const { collections, subCollections, articles } = metadata;
  const collectionMap = new Map(collections.map((c) => [c.id, c]));
  const subCollectionMap = new Map(subCollections.map((s) => [s.id, s]));

  let updated = 0;
  const updatedArticles = articles.map((article) => {
    const collection = collectionMap.get(article.collectionId);
    const subCollection = subCollectionMap.get(article.subCollectionId);
    if (!collection || !subCollection) {
      console.warn(`Skip article ${article.slug}: missing collection or subCollection`);
      return article;
    }
    const newUrl = getArticlePath(article, collection, subCollection);
    if (newUrl !== article.url) {
      updated++;
      return { ...article, url: newUrl };
    }
    return article;
  });

  metadata.articles = updatedArticles;
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log(`Updated ${updated} article URLs in ${METADATA_FILE}`);
}

main();
