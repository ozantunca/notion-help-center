import * as fs from 'fs';
import * as path from 'path';
import type { Collection, SubCollection, Article } from './types';
import type { SearchDocument } from './search-index';
import { normalizeSiteConfig, type SiteConfig } from './site-config';
import { getDb } from './db';
import { getHelpDataDir } from './data-dir';
import { ensureHelpPublicDir, getHelpPublicDir } from './public-dir';

export interface HelpMetadata {
  collections: Collection[];
  subCollections: SubCollection[];
  articles: Article[];
  lastSynced?: string;
}

function rowToCollection(row: {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  slug: string | null;
}): Collection {
  const c: Collection = {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
  };
  if (row.icon) c.icon = row.icon;
  if (row.slug) c.slug = row.slug;
  return c;
}

function rowToSubCollection(row: {
  id: string;
  title: string;
  collection_id: string;
  legacy_id: string | null;
}): SubCollection {
  const s: SubCollection = {
    id: row.id,
    title: row.title,
    collectionId: row.collection_id,
  };
  if (row.legacy_id) s.legacyId = row.legacy_id;
  return s;
}

function rowToArticle(row: {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  published: number;
  suggested: number;
  last_updated: string;
  collection_id: string;
  sub_collection_id: string;
  content: string | null;
  url: string;
  legacy_id: string | null;
}): Article {
  const a: Article = {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    slug: row.slug,
    published: Boolean(row.published),
    suggested: Boolean(row.suggested),
    lastUpdated: row.last_updated,
    collectionId: row.collection_id,
    subCollectionId: row.sub_collection_id,
    url: row.url,
  };
  if (row.content != null && row.content !== '') a.content = row.content;
  if (row.legacy_id) a.legacyId = row.legacy_id;
  return a;
}

function loadHelpMetadataFromJsonFile(): HelpMetadata | null {
  const metadataPath = path.join(getHelpDataDir(), 'metadata.json');
  if (!fs.existsSync(metadataPath)) return null;
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as HelpMetadata;
    return {
      collections: metadata.collections || [],
      subCollections: metadata.subCollections || [],
      articles: metadata.articles || [],
      lastSynced: metadata.lastSynced,
    };
  } catch {
    return null;
  }
}

/**
 * Load all help content from SQLite (canonical store).
 * Falls back to data/metadata.json if the database has no collections yet.
 */
export function loadHelpMetadata(): HelpMetadata {
  const database = getDb();

  const collections = database
    .prepare(
      `SELECT id, title, description, icon, slug FROM collections ORDER BY title`,
    )
    .all()
    .map((row) => rowToCollection(row as Parameters<typeof rowToCollection>[0]));

  const subCollections = database
    .prepare(
      `SELECT id, title, collection_id, legacy_id FROM sub_collections ORDER BY title`,
    )
    .all()
    .map((row) =>
      rowToSubCollection(row as Parameters<typeof rowToSubCollection>[0]),
    );

  const articles = database
    .prepare(
      `SELECT id, title, description, slug, published, suggested, last_updated,
              collection_id, sub_collection_id, content, url, legacy_id
       FROM articles`,
    )
    .all()
    .map((row) => rowToArticle(row as Parameters<typeof rowToArticle>[0]));

  const lastSyncedRow = database
    .prepare(`SELECT value FROM sync_meta WHERE key = 'last_synced'`)
    .get() as { value: string } | undefined;

  if (collections.length === 0) {
    const fallback = loadHelpMetadataFromJsonFile();
    if (fallback) return fallback;
  }

  return {
    collections,
    subCollections,
    articles,
    lastSynced: lastSyncedRow?.value,
  };
}

export interface SearchSnapshot {
  index: object;
  documents: SearchDocument[];
}

export function loadSearchSnapshot(): SearchSnapshot | null {
  const database = getDb();
  const row = database
    .prepare(
      `SELECT index_json, documents_json FROM search_snapshot WHERE id = 1`,
    )
    .get() as { index_json: string; documents_json: string } | undefined;

  if (row) {
    try {
      return {
        index: JSON.parse(row.index_json) as object,
        documents: JSON.parse(row.documents_json) as SearchDocument[],
      };
    } catch {
      /* fall through */
    }
  }

  const searchPath = path.join(getHelpPublicDir(), 'search-index.json');
  if (!fs.existsSync(searchPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(searchPath, 'utf-8')) as {
      index?: object;
      documents?: SearchDocument[];
    };
    if (parsed.index && parsed.documents) {
      return { index: parsed.index, documents: parsed.documents };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Raw site config object from last sync/seed (before env overlay). */
export function loadSiteConfigDiskRaw(): Record<string, unknown> | null {
  const database = getDb();
  const row = database.prepare(`SELECT json FROM site_config WHERE id = 1`).get() as
    | { json: string }
    | undefined;
  if (row) {
    try {
      return JSON.parse(row.json) as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }
  const sitePath = path.join(getHelpPublicDir(), 'site-config.json');
  if (fs.existsSync(sitePath)) {
    try {
      return JSON.parse(fs.readFileSync(sitePath, 'utf-8')) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Site config for SSR and public API: SQLite `site_config`, then `site-config.json` under `getHelpPublicDir()`, then defaults.
 * Edit via **Admin** (`/admin`) when `ADMIN_USERNAME` / `ADMIN_PASSWORD` are set.
 */
export function loadSiteConfig(): SiteConfig {
  const disk = loadSiteConfigDiskRaw();
  return normalizeSiteConfig(disk ?? {});
}

/** Persist site settings (admin save + JSON mirror for tooling). */
export function saveSiteConfigOnly(siteConfig: SiteConfig): void {
  const database = getDb();
  database.prepare(`INSERT OR REPLACE INTO site_config (id, json) VALUES (1, ?)`).run(
    JSON.stringify(siteConfig),
  );
  ensureHelpPublicDir();
  const sitePath = path.join(getHelpPublicDir(), 'site-config.json');
  fs.writeFileSync(sitePath, JSON.stringify(siteConfig, null, 2));
}

/**
 * Replace all content and search snapshot (used by sync).
 */
export function saveHelpCenterData(params: {
  collections: Collection[];
  subCollections: SubCollection[];
  articles: Article[];
  searchIndex: { index: object; documents: SearchDocument[] };
  siteConfig: SiteConfig;
  lastSynced: string;
}): void {
  const database = getDb();
  const tx = database.transaction(() => {
    database.prepare(`DELETE FROM articles`).run();
    database.prepare(`DELETE FROM sub_collections`).run();
    database.prepare(`DELETE FROM collections`).run();

    const insCol = database.prepare(
      `INSERT INTO collections (id, title, description, icon, slug)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const c of params.collections) {
      insCol.run(
        c.id,
        c.title,
        c.description ?? '',
        c.icon ?? null,
        c.slug ?? null,
      );
    }

    const insSub = database.prepare(
      `INSERT INTO sub_collections (id, title, collection_id, legacy_id)
       VALUES (?, ?, ?, ?)`,
    );
    for (const s of params.subCollections) {
      insSub.run(s.id, s.title, s.collectionId, s.legacyId ?? null);
    }

    const insArt = database.prepare(
      `INSERT INTO articles (
        id, title, description, slug, published, suggested, last_updated,
        collection_id, sub_collection_id, content, url, legacy_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const a of params.articles) {
      insArt.run(
        a.id,
        a.title,
        a.description,
        a.slug,
        a.published ? 1 : 0,
        a.suggested ? 1 : 0,
        a.lastUpdated,
        a.collectionId,
        a.subCollectionId,
        a.content ?? null,
        a.url,
        a.legacyId ?? null,
      );
    }

    database.prepare(
      `INSERT OR REPLACE INTO search_snapshot (id, index_json, documents_json)
       VALUES (1, ?, ?)`,
    ).run(
      JSON.stringify(params.searchIndex.index),
      JSON.stringify(params.searchIndex.documents),
    );

    database.prepare(
      `INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_synced', ?)`,
    ).run(params.lastSynced);

    database.prepare(`INSERT OR REPLACE INTO site_config (id, json) VALUES (1, ?)`).run(
      JSON.stringify(params.siteConfig),
    );
  });

  tx();
}

/** Rebuild Lunr snapshot from current articles (e.g. after URL fixes) without a full Notion sync. */
export function saveSearchSnapshotOnly(searchIndex: {
  index: object;
  documents: SearchDocument[];
}): void {
  const database = getDb();
  database
    .prepare(
      `INSERT OR REPLACE INTO search_snapshot (id, index_json, documents_json) VALUES (1, ?, ?)`,
    )
    .run(
      JSON.stringify(searchIndex.index),
      JSON.stringify(searchIndex.documents),
    );

  ensureHelpPublicDir();
  const searchPath = path.join(getHelpPublicDir(), 'search-index.json');
  fs.writeFileSync(searchPath, JSON.stringify(searchIndex, null, 2));
}
