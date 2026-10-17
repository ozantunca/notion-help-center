import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { getHelpDataDir } from './data-dir';
import { runMigrations } from './db-migrations';

let db: Database.Database | null = null;

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

  const dbPath = path.join(dir, 'help-center.db');
  const database = new Database(dbPath);
  runMigrations(database, dbPath);
  migrateLegacyFeedback(database);
  db = database;

  return db;
}
