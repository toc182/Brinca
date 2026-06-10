import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 0005: Drill description (text + photos).
 *
 * Adds the `description TEXT` column to `drills` and creates the
 * `drill_photos` 1-to-N child table (mirrors session_photos /
 * drill_result_photos). Device-only columns: `local_uri`,
 * `upload_status` ('pending' | 'uploaded' | 'failed'), and nullable
 * storage_url / storage_path (NOT NULL on Supabase but locally nullable
 * until the upload pipeline returns a public URL).
 *
 * The ALTER is PRAGMA-guarded so the migration is a no-op on fresh
 * installs (where TABLE_DEFINITIONS already includes the column at
 * migration 1). SQLite has no IF NOT EXISTS for ALTER, so we run the
 * migration as a TS procedure instead of an exec string.
 */
export const migration = {
  version: 5,
  run: async (db: SQLiteDatabase) => {
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(drills)`,
    );
    const hasDescription = cols.some((c) => c.name === 'description');
    if (!hasDescription) {
      await db.runAsync(`ALTER TABLE drills ADD COLUMN description TEXT`);
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS drill_photos (
        id TEXT PRIMARY KEY,
        drill_id TEXT NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
        storage_url TEXT,
        storage_path TEXT,
        local_uri TEXT,
        upload_status TEXT NOT NULL DEFAULT 'pending',
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS drill_photos_drill_id_idx
        ON drill_photos(drill_id);
    `);
  },
};
