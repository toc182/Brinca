import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 0007: Soft delete for tracking elements.
 *
 * Same rationale as 0006 (activities/drills): element_values reference
 * tracking_elements with no ON DELETE rule, so a hard DELETE fails the
 * moment an element has logged session data — and stats need the row to
 * label that history. "Remove element" stamps deleted_at instead;
 * getElementsByDrill filters it out, lookups by id stay unfiltered.
 *
 * Separate from 0006 because 0006 has already run on devices in the field;
 * applied migrations are never edited. PRAGMA-guarded for fresh installs.
 */
export const migration = {
  version: 7,
  run: async (db: SQLiteDatabase) => {
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(tracking_elements)`,
    );
    if (!cols.some((c) => c.name === 'deleted_at')) {
      await db.runAsync(`ALTER TABLE tracking_elements ADD COLUMN deleted_at TEXT`);
    }
  },
};
