import * as SQLite from 'expo-sqlite';

import { migrations } from './migrations/0001_initial';

const DB_NAME = 'brinca.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await runMigrations(db);

  dbInstance = db;
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version ASC'
  );
  const appliedVersions = new Set(applied.map((r) => r.version));

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;

    await db.withTransactionAsync(async () => {
      // Migrations are either a raw SQL string (declarative, idempotent
      // CREATE/INSERT/UPDATE) or an async runner (for cases SQLite can't
      // express declaratively — e.g. ALTER TABLE ADD COLUMN, which has no
      // IF NOT EXISTS form and must be guarded by a PRAGMA check).
      if ('sql' in migration) {
        await db.execAsync(migration.sql);
      } else {
        await migration.run(db);
      }
      await db.runAsync(
        'INSERT INTO _migrations (version) VALUES (?)',
        migration.version
      );
    });
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
