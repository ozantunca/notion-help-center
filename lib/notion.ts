import { Client, isFullPage } from '@notionhq/client';
import { Collection, SubCollection, Article } from './types';

/** Notion page `icon` payload (subset used for collections). */
type NotionPageIcon =
  | { type: 'emoji'; emoji: string }
  | { type: 'external'; external: { url: string } }
  | { type: 'file'; file: { url: string } }
  | { type: 'custom_emoji'; custom_emoji: { url: string } }
  | null;

/** Map Notion page `icon` to a single stored string (emoji char or URL). */
export function notionPageIconToString(icon: NotionPageIcon | undefined): string | undefined {
  if (!icon) return undefined;
  if (icon.type === 'emoji') return icon.emoji;
  if (icon.type === 'external') return icon.external.url;
  if (icon.type === 'file') return icon.file.url;
  if (icon.type === 'custom_emoji') return icon.custom_emoji.url;
  return undefined;
}

let notionClient: Client | null = null;

/**
 * Get or create the Notion client instance
 * This factory function ensures env vars are loaded before creating the client
 */
function getNotionClient(): Client {
  if (!notionClient) {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }
    notionClient = new Client({
      auth: process.env.NOTION_API_KEY,
    });
  }
  return notionClient;
}

/**
 * Export getNotionClient for use in sync script
 */
export { getNotionClient };

/**
 * Get the root page ID from the public Notion URL or database ID
 */
export function getRootPageId(): string {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error('NOTION_DATABASE_ID environment variable is required');
  }
  return databaseId;
}

/**
 * Fetch all collections from the root database
 */
export async function fetchCollections(): Promise<Collection[]> {
  const notion = getNotionClient();
  const rootPageId = getRootPageId();
  const response = await notion.databases.query({
    database_id: rootPageId,
  });

  return response.results
    .filter((page): page is typeof page & { properties: any } => 'properties' in page)
    .map((page) => {
      const props = page.properties;
      const titleProp = props['Collection Title'] || props.Title;
      const descProp = props['Collection Description'] || props.Description;

      if (titleProp && 'title' in titleProp && titleProp.title.length > 0) {
        const collection: Collection = {
          id: page.id,
          title: titleProp.title[0].plain_text,
          description:
            descProp && 'rich_text' in descProp && descProp.rich_text.length > 0
              ? descProp.rich_text[0].plain_text
              : '',
        };
        if (isFullPage(page)) {
          const icon = notionPageIconToString(page.icon as NotionPageIcon);
          if (icon) collection.icon = icon;
        }
        return collection;
      }
      return null;
    })
    .filter((collection): collection is Collection => collection !== null);
}

/**
 * Fetch sub-collections (article databases) from a collection page
 */
export async function fetchSubCollections(collectionPageId: string): Promise<SubCollection[]> {
  const notion = getNotionClient();
  const children = await notion.blocks.children.list({
    block_id: collectionPageId,
  });

  return children.results
    .filter(
      (block): block is typeof block & { type: 'child_database' } =>
        'type' in block && block.type === 'child_database',
    )
    .map((block) => ({
      id: block.id,
      title: 'child_database' in block ? block.child_database.title : '',
      collectionId: collectionPageId,
    }));
}

/**
 * Fetch articles from a sub-collection (database)
 */
export async function fetchArticles(
  subCollectionId: string,
  collectionId: string,
  _subCollectionTitle: string,
): Promise<Article[]> {
  const notion = getNotionClient();
  const response = await notion.databases.query({
    database_id: subCollectionId,
  });

  return response.results
    .filter((page): page is typeof page & { properties: any } => 'properties' in page)
    .map((page) => {
      const props = page.properties;
      const titleProp = props['Article Title'] || props.Title;
      const descProp = props['Article Description'] || props.Description;
      const publishedProp = props.Published;
      const suggestedProp = props.Suggested;
      const lastUpdatedProp = props['Last Updated'];

      if (titleProp && 'title' in titleProp && titleProp.title.length > 0) {
        const title = titleProp.title[0].plain_text;
        const slug = generateSlug(title);
        const published =
          publishedProp && 'checkbox' in publishedProp ? publishedProp.checkbox : false;
        const suggested =
          suggestedProp && 'checkbox' in suggestedProp ? suggestedProp.checkbox : false;
        let lastUpdated: string;
        if (lastUpdatedProp && 'last_edited_time' in lastUpdatedProp) {
          lastUpdated = lastUpdatedProp.last_edited_time;
        } else if (
          'last_edited_time' in page &&
          typeof (page as any).last_edited_time === 'string'
        ) {
          lastUpdated = (page as any).last_edited_time;
        } else {
          lastUpdated = new Date().toISOString();
        }

        return {
          id: page.id,
          title,
          description:
            descProp && 'rich_text' in descProp && descProp.rich_text.length > 0
              ? descProp.rich_text[0].plain_text
              : '',
          slug,
          published,
          suggested,
          lastUpdated,
          collectionId,
          subCollectionId,
          url: `/${collectionId}/${subCollectionId}/${slug}`,
        };
      }
      return null;
    })
    .filter((article): article is Article => article !== null);
}

/**
 * Fetch article content as Markdown string
 * Uses notion-to-md to convert Notion page to Markdown
 */
export async function fetchArticleContent(pageId: string): Promise<string> {
  // This will be implemented in the sync script using notion-to-md
  // We return the pageId here for now, the actual conversion happens in sync
  return pageId;
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetch all data: collections, sub-collections, and articles
 */
export async function fetchAllData(): Promise<{
  collections: Collection[];
  subCollections: SubCollection[];
  articles: Article[];
}> {
  const collections = await fetchCollections();

  const subCollectionResults = await Promise.all(
    collections.map((collection) => fetchSubCollections(collection.id)),
  );
  const subCollections = subCollectionResults.flat();

  const articleResults = await Promise.all(
    subCollectionResults.map((subs, index) =>
      Promise.all(subs.map((sub) => fetchArticles(sub.id, collections[index].id, sub.title))),
    ),
  );
  const articles = articleResults.flat(2);

  return { collections, subCollections, articles };
}
