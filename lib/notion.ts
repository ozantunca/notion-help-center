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
 * Every row of a database, oldest first. The API returns at most 100 rows per
 * call, so follow `next_cursor` until the end.
 *
 * The API cannot read a view's manual (drag-and-drop) order. Creation time is
 * the closest stable order; an `Order` number property overrides it (see
 * {@link sortByOrderProperty}).
 */
async function queryAllRows(databaseId: string) {
  const notion = getNotionClient();
  const rows: Awaited<ReturnType<Client['databases']['query']>>['results'] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      start_cursor: cursor,
    });
    rows.push(...response.results);
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return sortByOrderProperty(rows);
}

/** `Order` number property of a row, or null when the database has none or it is empty. */
function orderOf(row: unknown): number | null {
  const prop = (row as { properties?: Record<string, any> }).properties?.Order;
  return prop && prop.type === 'number' && typeof prop.number === 'number' ? prop.number : null;
}

/**
 * Rows with an `Order` number come first, lowest first. Rows without one keep
 * their creation order after them (the sort is stable).
 */
function sortByOrderProperty<T>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const x = orderOf(a);
    const y = orderOf(b);
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    return x - y;
  });
}

/**
 * Fetch all collections from the root database
 */
export async function fetchCollections(): Promise<Collection[]> {
  const rows = await queryAllRows(getRootPageId());

  return rows
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
 * Fetch sub-collections (article databases) from a collection page, in the
 * order they appear on the page.
 */
export async function fetchSubCollections(collectionPageId: string): Promise<SubCollection[]> {
  const notion = getNotionClient();
  const blocks: Awaited<ReturnType<Client['blocks']['children']['list']>>['results'] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: collectionPageId,
      start_cursor: cursor,
    });
    blocks.push(...response.results);
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks
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
  const rows = await queryAllRows(subCollectionId);

  return rows
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
