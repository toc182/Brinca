import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 0006: Soft delete for activities and drills.
 *
 * Adds a nullable `deleted_at TEXT` column to both tables. "Deleting" an
 * activity or drill stamps this column instead of removing the row, because
 * sessions reference activities and drill_results reference drills with no
 * ON DELETE rule (locally AND on Supabase) — a hard DELETE is rejected the
 * moment the item has any session history, and stats screens need the rows
 * to resolve names for that history anyway.
 *
 * List queries (builder, activity selector, onboarding, stats filter chips)
 * filter on `deleted_at IS NULL`; history lookups by id stay unfiltered.
 *
 * The ALTERs are PRAGMA-guarded so the migration is a no-op on fresh
 * installs (where TABLE_DEFINITIONS already includes the column).
 */
export const migration = {
  version: 6,
  run: async (db: SQLiteDatabase) => {
    const activityCols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(activities)`,
    );
    if (!activityCols.some((c) => c.name === 'deleted_at')) {
      await db.runAsync(`ALTER TABLE activities ADD COLUMN deleted_at TEXT`);
    }

    const drillCols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(drills)`,
    );
    if (!drillCols.some((c) => c.name === 'deleted_at')) {
      await db.runAsync(`ALTER TABLE drills ADD COLUMN deleted_at TEXT`);
    }
  },
};
