import * as fs from 'fs';
import * as path from 'path';
import { NotionToMarkdown } from 'notion-to-md';
import { fetchAllData, getNotionClient } from './notion';
import { downloadMedia, processMarkdownImages } from './media';
import { generateSearchIndex } from './search-index';
import { getArticlePath, slugify } from './article-url';
import type { Collection, SubCollection, Article } from './types';
import { saveHelpCenterData, loadSiteConfigDiskRaw } from './help-data';
import { finalizeSiteConfigFromDisk } from './site-config-env';
import { getHelpDataDir } from './data-dir';
import { ensureHelpPublicDir, getHelpPublicDir } from './public-dir';

/** Full Notion → SQLite + JSON mirrors (same as `npm run sync`). */
export async function runNotionSync(): Promise<void> {
  console.log('🔄 Starting Notion sync...');

  const dataDir = getHelpDataDir();
  const metadataFile = path.join(dataDir, 'metadata.json');

  console.log('📥 Fetching collections, sub-collections, and articles...');
  const { collections, subCollections, articles } = await fetchAllData();

  console.log(
    `✅ Found ${collections.length} collections, ${subCollections.length} sub-collections, ${articles.length} articles`,
  );

  const publishedArticles = articles.filter((a) => a.published);
  console.log(`📝 ${publishedArticles.length} published articles`);

  const collectionsWithSlug: Collection[] = collections.map((c) => ({
    ...c,
    slug: c.slug || (c.title ? slugify(c.title) : undefined),
  }));

  for (const c of collectionsWithSlug) {
    if (c.icon && /^https?:\/\//i.test(c.icon)) {
      try {
        let ext = '.png';
        try {
          const parsed = new URL(c.icon);
          const e = path.extname(parsed.pathname);
          if (e && /^\.[a-z0-9]{1,8}$/i.test(e)) ext = e;
        } catch {
          /* default .png */
        }
        const name = `collection-icon-${c.id.replace(/-/g, '')}${ext}`;
        c.icon = await downloadMedia(c.icon, name);
        console.log(`  ✓ Collection icon: ${c.title}`);
      } catch (err) {
        console.warn(`  ⚠ Collection icon download failed (${c.title}):`, err);
      }
    }
  }

  const collectionMap = new Map(collectionsWithSlug.map((c) => [c.id, c]));
  const subCollectionMap = new Map(subCollections.map((s) => [s.id, s]));
  const articlesWithNewUrls = publishedArticles.map((article) => {
    const collection = collectionMap.get(article.collectionId);
    const subCollection = subCollectionMap.get(article.subCollectionId);
    const url =
      collection && subCollection
        ? getArticlePath(article, collection, subCollection)
        : article.url;
    return { ...article, url };
  });

  console.log('📄 Fetching article content and converting to Markdown...');
  const notion = getNotionClient();
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const contentMap = new Map<string, string>();
  const textContentMap = new Map<string, string>();

  const siteConfig = await finalizeSiteConfigFromDisk(loadSiteConfigDiskRaw());
  console.log('   - site config preserved from DB/file (remote logo rehosted under /media when applicable)');

  await Promise.all(
    publishedArticles.map(async (article) => {
      try {
        const mdBlocks = await n2m.pageToMarkdown(article.id);
        const mdString = n2m.toMarkdownString(mdBlocks).parent || '';
        const processedMd = await processMarkdownImages(mdString);

        contentMap.set(article.id, processedMd);
        textContentMap.set(article.id, processedMd.replace(/[#*`[\]()]/g, ' '));
        console.log(`  ✓ ${article.title}`);
      } catch (error) {
        console.error(`  ✗ Failed to fetch content for ${article.title}:`, error);
      }
    }),
  );

  console.log('🔍 Generating search index...');
  const searchIndex = generateSearchIndex(articlesWithNewUrls, textContentMap);

  const lastSynced = new Date().toISOString();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const articlesWithContent: Article[] = articlesWithNewUrls.map((article) => ({
    ...article,
    content: contentMap.get(article.id),
  }));

  const metadata = {
    collections: collectionsWithSlug,
    subCollections,
    articles: articlesWithContent,
    lastSynced,
  };

  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  ensureHelpPublicDir();
  const publicDir = getHelpPublicDir();
  fs.writeFileSync(
    path.join(publicDir, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2),
  );
  fs.writeFileSync(
    path.join(publicDir, 'site-config.json'),
    JSON.stringify(siteConfig, null, 2),
  );

  saveHelpCenterData({
    collections: collectionsWithSlug,
    subCollections,
    articles: articlesWithContent,
    searchIndex,
    siteConfig,
    lastSynced,
  });

  console.log('✅ Sync completed successfully!');
  console.log(`   - ${collections.length} collections`);
  console.log(`   - ${subCollections.length} sub-collections`);
  console.log(`   - ${publishedArticles.length} published articles`);
  console.log('   - SQLite help-center.db updated');
  console.log('   - site-config.json updated');
}
