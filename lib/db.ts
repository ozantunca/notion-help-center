import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { getHelpDataDir } from './data-dir';

let db: Database.Database | null = null;

function ensureSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS article_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      rating TEXT NOT NULL CHECK (rating IN ('positive', 'neutral', 'negative')),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT,
      slug TEXT
    );

    CREATE TABLE IF NOT EXISTS sub_collections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      legacy_id TEXT
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      slug TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      suggested INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      sub_collection_id TEXT NOT NULL,
      content TEXT,
      url TEXT NOT NULL,
      legacy_id TEXT
    );

    CREATE TABLE IF NOT EXISTS search_snapshot (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      index_json TEXT NOT NULL,
      documents_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL
    );
  `);
}

/**
 * One-time migration: copy feedback rows from legacy data/feedback.db into help-center.db
 */
function migrateLegacyFeedback(database: Database.Database): void {
  const legacyPath = path.join(getHelpDataDir(), 'feedback.db');
  if (!fs.existsSync(legacyPath)) return;

  try {
    const legacy = new Database(legacyPath, { readonly: true });
    const rows = legacy
      .prepare(
        `SELECT article_id, rating, comment, created_at FROM article_feedback`,
      )
      .all() as {
      article_id: string;
      rating: string;
      comment: string | null;
      created_at: string | null;
    }[];
    legacy.close();

    const insert = database.prepare(
      `INSERT OR IGNORE INTO article_feedback (article_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?)`,
    );
    const tx = database.transaction(() => {
      for (const r of rows) {
        insert.run(r.article_id, r.rating, r.comment ?? null, r.created_at ?? null);
      }
    });
    tx();
  } catch {
    // ignore migration errors
  }
}

export function getDb(): Database.Database {
  if (db) return db;

  const dir = getHelpDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(path.join(dir, 'help-center.db'));
  ensureSchema(db);
  migrateLegacyFeedback(db);

  return db;
}
