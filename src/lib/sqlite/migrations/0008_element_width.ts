import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 0008: per-element layout width.
 *
 * Adds `width TEXT NOT NULL DEFAULT 'full'` to `tracking_elements`. PRAGMA-
 * guarded so it's a no-op on fresh installs (where TABLE_DEFINITIONS already
 * includes the column at migration 1). SQLite has no IF NOT EXISTS for ALTER,
 * so this runs as a TS procedure. No CHECK locally — the type column is
 * likewise unconstrained here; Supabase enforces the allowed values.
 */
export const migration = {
  version: 8,
  run: async (db: SQLiteDatabase) => {
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(tracking_elements)`,
    );
    const hasWidth = cols.some((c) => c.name === 'width');
    if (!hasWidth) {
      await db.runAsync(
        `ALTER TABLE tracking_elements ADD COLUMN width TEXT NOT NULL DEFAULT 'full'`,
      );
    }
  },
};
