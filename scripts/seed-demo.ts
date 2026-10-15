/**
 * Populate SQLite + public JSON files with generic demo content (no Notion required).
 * Run: pnpm run seed  (or pnpm exec tsx scripts/seed-demo.ts)
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

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const collections: Collection[] = [
  {
    id: uuid(1),
    title: 'Getting Started',
    description: 'Set up your help center and publish your first articles.',
    slug: 'getting-started',
    icon: '🚀',
  },
  {
    id: uuid(2),
    title: 'Writing in Notion',
    description: 'Formatting, structure, and the Notion blocks that sync to your site.',
    slug: 'writing-in-notion',
    icon: '✍️',
  },
  {
    id: uuid(3),
    title: 'Customization',
    description: 'Logo, colors, navigation, and the embeddable widget.',
    slug: 'customization',
    icon: '🎨',
  },
];

const subCollections: SubCollection[] = [
  { id: uuid(11), title: 'Introduction', collectionId: uuid(1) },
  { id: uuid(12), title: 'Deployment', collectionId: uuid(1) },
  { id: uuid(21), title: 'Formatting', collectionId: uuid(2) },
  { id: uuid(31), title: 'Branding', collectionId: uuid(3) },
];

const RICH_CONTENT = `Your help center turns a Notion database into a fast, searchable docs site. This page walks through the moving parts.

> 💡 Edits in Notion appear on the site after the next sync. In production this runs every six hours, or right after the server starts.

# Connect Notion

Create an integration at **notion.so/my-integrations**, then share your knowledge base database with it.

- [x] Duplicate the template into your workspace
- [x] Create an integration and copy the token
- [ ] Share the database with the integration

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| \`NOTION_API_KEY\` | Yes | Integration token |
| \`NOTION_DATABASE_ID\` | Yes | The knowledge base database |
| \`HELP_CENTER_URL\` | Yes | Public URL, used for links and the sitemap |
| \`HELP_CENTER_SYNC_CRON\` | No | Sync schedule, default every six hours |

# Run the sync

\`\`\`bash
pnpm install
pnpm run sync
pnpm run dev
\`\`\`

<details>
<summary>What does the sync store?</summary>
Collections, sections, and **published** articles go into SQLite. Images are downloaded to the media folder so links from Notion never expire.
</details>

<details>
<summary>Can I skip Notion for a local preview?</summary>
Yes. Run \`pnpm run seed\` to load this demo content instead.
</details>

# Next steps

Pick a logo and brand colors in \`/admin\`, then ~~wait for customers to find you~~ link the help center from your app.

> Tip without an emoji stays a normal quote.`;

let n = 100;
const article = (
  subCollectionId: string,
  title: string,
  description: string,
  extra: Partial<Article> = {},
): Article => {
  const sub = subCollections.find((sc) => sc.id === subCollectionId)!;
  const collection = collections.find((c) => c.id === sub.collectionId)!;
  const id = uuid(++n);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    id,
    title,
    description,
    slug,
    published: true,
    suggested: false,
    lastUpdated: '2026-10-02T09:00:00.000Z',
    collectionId: collection.id,
    subCollectionId: sub.id,
    url: `/${collection.slug}/${sub.id}/${slug}/${id}`,
    content: `${description}\n\n## Overview\n\nThis is **demo content** for the open-source Notion Help Center template.\n\n## Details\n\n- Write the article in Notion.\n- Run \`pnpm run sync\` to publish it.`,
    ...extra,
  };
};

const articles: Article[] = [
  article(uuid(11), 'How the help center works', 'A tour of Notion sync, search, and publishing.', {
    suggested: true,
    content: RICH_CONTENT,
  }),
  article(uuid(11), 'Duplicate the Notion template', 'Start from the recommended database structure.', {
    suggested: true,
  }),
  article(uuid(11), 'Publish or hide an article', 'Use the Published checkbox to control what goes live.'),
  article(uuid(12), 'Deploy with Docker', 'Run the help center with persistent data and media volumes.', {
    suggested: true,
  }),
  article(uuid(12), 'Use a custom domain', 'Point docs.example.com at your deployment.'),
  article(uuid(21), 'Callouts, toggles, and tables', 'Which Notion blocks render on the site and how.', {
    suggested: true,
  }),
  article(uuid(21), 'Images and media', 'Images are downloaded during sync and served from your domain.'),
  article(uuid(31), 'Change logo and colors', 'Update branding without touching code in /admin.', {
    suggested: true,
  }),
  article(uuid(31), 'Embed the help widget', 'Add a floating help button to any website.'),
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
