/**
 * Regenerate Lunr search index from SQLite / metadata (articles in DB or JSON fallback).
 * Run: npx tsx scripts/regenerate-search-index.ts
 */
import { generateSearchIndex } from '../lib/search-index';
import { loadHelpMetadata, saveSearchSnapshotOnly } from '../lib/help-data';
import type { Article } from '../lib/types';

function main() {
  const meta = loadHelpMetadata();
  const articles: Article[] = meta.articles || [];

  const textMap = new Map<string, string>(
    articles.map((a) => [a.id, (a.content || '').replace(/[#*`[\]()]/g, ' ')]),
  );
  const searchIndex = generateSearchIndex(articles, textMap);
  saveSearchSnapshotOnly(searchIndex);
  console.log(`Regenerated search index with ${articles.length} articles`);
}

main();
