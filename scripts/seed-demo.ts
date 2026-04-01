/**
 * Populate SQLite + public JSON files with generic demo content (no Notion required).
 * Run: npx tsx scripts/seed-demo.ts
 *
 */
import * as fs from 'fs';
import * as path from 'path';
import { generateSearchIndex } from '../lib/search-index';
import { saveHelpCenterData } from '../lib/help-data';
import { defaultSiteConfig } from '../lib/site-config';
import type { Article, Collection, SubCollection } from '../lib/types';
import { getHelpDataDir } from '../lib/data-dir';
import { ensureHelpPublicDir, getHelpPublicDir } from '../lib/public-dir';

const DATA_DIR = getHelpDataDir();
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

const COL_ID = '11111111-1111-1111-1111-111111111111';
const SUB_ID = '22222222-2222-2222-2222-222222222222';
const ART_ID = '33333333-3333-3333-3333-333333333333';

const collections: Collection[] = [
  {
    id: COL_ID,
    title: 'Getting Started',
    description: 'Learn the basics of this documentation site.',
    slug: 'getting-started',
    icon: '📖',
  },
];

const subCollections: SubCollection[] = [
  {
    id: SUB_ID,
    title: 'Introduction',
    collectionId: COL_ID,
  },
];

const articles: Article[] = [
  {
    id: ART_ID,
    title: 'Welcome to Notion Help Center',
    description: 'This is sample content for local development and OSS demos.',
    slug: 'welcome',
    published: true,
    suggested: true,
    lastUpdated: new Date().toISOString(),
    collectionId: COL_ID,
    subCollectionId: SUB_ID,
    url: `/getting-started/${SUB_ID}/welcome/${ART_ID}`,
    content: `# Welcome

This is **demo content** for the open-source **Notion Help Center** template.

- Run \`npm run sync\` to pull content from Notion in production.
- Use this seed when you only need a quick local preview.`,
  },
];

function main() {
  const siteConfig = defaultSiteConfig;
  const lastSynced = new Date().toISOString();

  const textMap = new Map<string, string>(
    articles.map((a) => [a.id, (a.content || '').replace(/[#*`[\]()]/g, ' ')]),
  );
  const searchIndex = generateSearchIndex(articles, textMap);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  ensureHelpPublicDir();
  const publicDir = getHelpPublicDir();

  fs.writeFileSync(
    METADATA_FILE,
    JSON.stringify(
      {
        collections,
        subCollections,
        articles,
        lastSynced,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(publicDir, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2),
  );
  fs.writeFileSync(
    path.join(publicDir, 'site-config.json'),
    JSON.stringify(siteConfig, null, 2),
  );

  saveHelpCenterData({
    collections,
    subCollections,
    articles,
    searchIndex,
    siteConfig,
    lastSynced,
  });

  console.log(
    `Demo data seeded: data/help-center.db, data/metadata.json, ${path.join(publicDir, 'search-index.json')}, ${path.join(publicDir, 'site-config.json')}`,
  );
}

main();
