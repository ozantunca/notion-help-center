import type Database from 'better-sqlite3';
import * as fs from 'fs';

export interface Migration {
  /** Stored in `PRAGMA user_version` after the migration runs. Must increase by 1. */
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

/**
 * Ordered schema migrations. Append new entries; never edit or reorder one that
 * has shipped in a release, because existing databases have already run it.
 *
 * Databases created before migrations existed (≤ 1.1.0) have `user_version = 0`
 * and the tables from migration 1 already present; `IF NOT EXISTS` makes that
 * first step a no-op for them.
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    up: (db) => {
      db.exec(`
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
    },
  },
  {
    version: 2,
    name: 'keep Notion order',
    up: (db) => {
      // NULL until the next sync, so existing content keeps sorting by title.
      db.exec(`
        ALTER TABLE collections ADD COLUMN position INTEGER;
        ALTER TABLE sub_collections ADD COLUMN position INTEGER;
        ALTER TABLE articles ADD COLUMN position INTEGER;
      `);
    },
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export function getSchemaVersion(db: Database.Database): number {
  return db.pragma('user_version', { simple: true }) as number;
}

function hasTables(db: Database.Database): boolean {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
    .get() as { n: number };
  return row.n > 0;
}

/**
 * Brings the database to {@link LATEST_SCHEMA_VERSION}.
 *
 * - A database with data is copied to `<file>.backup-v<from>` first (one copy per
 *   starting version), so a failed upgrade can be rolled back by restoring it.
 * - Each migration runs in its own transaction together with its version bump.
 * - A database from a newer release is refused instead of being written by older
 *   code: restore the backup or run the newer image.
 */
export function runMigrations(db: Database.Database, dbPath: string): void {
  const current = getSchemaVersion(db);

  if (current > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `[db] Database schema v${current} is newer than this app supports (v${LATEST_SCHEMA_VERSION}). ` +
        `Run a newer release, or restore a backup taken before the upgrade (${dbPath}.backup-v*).`,
    );
  }

  const pending = MIGRATIONS.filter((m) => m.version > current);
  if (pending.length === 0) return;

  if (hasTables(db)) {
    const backupPath = `${dbPath}.backup-v${current}`;
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
    db.prepare('VACUUM INTO ?').run(backupPath);
    console.log(`[db] Backed up database to ${backupPath}`);
  }

  for (const migration of pending) {
    db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    })();
    console.log(`[db] Migrated schema to v${migration.version} (${migration.name})`);
  }
}
