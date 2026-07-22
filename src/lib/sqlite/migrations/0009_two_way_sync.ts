import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 0009: groundwork for two-way sync.
 *
 * Until now sync only ran one direction — local changes were pushed to
 * Supabase and the server was read exactly once, on a device with an empty
 * table (see rehydrate.ts). Two devices on the same account therefore drifted
 * apart permanently: whatever you organised on phone A never reached phone B.
 *
 * A download step asks "give me every row that changed since my last pull",
 * which requires two things on every synced table:
 *
 *  1. `updated_at` — so "changed since" is answerable. Supabase stamps it via
 *     the set_updated_at trigger; locally it is written by the pull itself.
 *  2. `deleted_at` — so deletion is a *change* rather than an absence. A hard
 *     DELETE leaves nothing for the other device to observe, so the row simply
 *     reappears on its next pull. This is precisely the bug that resurrected
 *     already-deleted activities and drills on a second phone.
 *
 * activities / drills / tracking_elements already had `deleted_at` (0006,
 * 0007). This adds the remaining columns to match the Supabase migrations
 * `two_way_sync_metadata` and `two_way_sync_photo_updated_at`.
 *
 * currency_ledger and accolade_unlocks are deliberately excluded: both are
 * append-only and immutable, so the pull can delta them by created_at /
 * unlocked_at and there is nothing to tombstone.
 *
 * Every ALTER is PRAGMA-guarded (SQLite has no ADD COLUMN IF NOT EXISTS) so
 * this is a no-op on fresh installs, where TABLE_DEFINITIONS already includes
 * the columns.
 *
 * Note on defaults: SQLite rejects a non-constant DEFAULT in ALTER TABLE ADD
 * COLUMN, so `updated_at` is added nullable here and backfilled from
 * created_at. Fresh installs get the NOT NULL DEFAULT form from schema.ts.
 */

/** Tables gaining `updated_at` (all already have created_at to backfill from). */
const NEEDS_UPDATED_AT = [
  'element_values',
  'rewards',
  'drill_photos',
  'session_photos',
  'drill_result_photos',
] as const;

/** Tables gaining `deleted_at` so deletions can propagate between devices. */
const NEEDS_DELETED_AT = [
  'element_values',
  'rewards',
  'drill_photos',
  'session_photos',
  'drill_result_photos',
  'measurements',
  'external_activities',
  'tier_rewards',
  'bonus_presets',
] as const;

async function hasColumn(db: SQLiteDatabase, table: string, column: string): Promise<boolean> {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return cols.some((c) => c.name === column);
}

export const migration = {
  version: 9,
  run: async (db: SQLiteDatabase) => {
    for (const table of NEEDS_UPDATED_AT) {
      if (!(await hasColumn(db, table, 'updated_at'))) {
        await db.runAsync(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
        // Backfill so the column is never null for pre-existing rows; the pull
        // compares against it and a null would sort unpredictably.
        await db.runAsync(
          `UPDATE ${table} SET updated_at = created_at WHERE updated_at IS NULL`,
        );
      }
    }

    for (const table of NEEDS_DELETED_AT) {
      if (!(await hasColumn(db, table, 'deleted_at'))) {
        await db.runAsync(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT`);
      }
    }

    // Per-table download watermark. Kept in SQLite rather than MMKV so it is
    // wiped together with the data it describes — a watermark that outlived
    // its rows would silently skip the backfill that repopulates them.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS sync_state (
        table_name TEXT PRIMARY KEY,
        last_pulled_at TEXT
      )
    `);
  },
};
