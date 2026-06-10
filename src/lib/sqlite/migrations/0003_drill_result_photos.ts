/**
 * Migration 0003: Multi-photo support for drills.
 *
 * Creates the drill_result_photos child table (mirrors element_values 1-to-N
 * pattern). The local schema carries three device-only columns not present on
 * Supabase: `local_uri` (the picker URI, kept until upload confirms),
 * `upload_status` ('pending' | 'uploaded' | 'failed'), and nullable
 * storage_url/storage_path (they're NOT NULL on Supabase, but a row exists
 * locally before the upload returns a public URL).
 *
 * Also cleans up broken legacy local URIs that the former single-photo flow
 * silently wrote into drill_results.photo_url and sessions.photo_url. Those
 * values (file://, content://, ph://) were never valid public URLs — the
 * uploadMedia helper was never called from those code paths. Any queued
 * UPDATE payloads carrying those URIs are deleted from sync_queue so we
 * stop replaying garbage to Supabase.
 *
 * Idempotent — no-op for fresh installs (CREATE TABLE IF NOT EXISTS, and
 * the UPDATE/DELETE statements naturally find nothing).
 */
export const migration = {
  version: 3,
  sql: `
    CREATE TABLE IF NOT EXISTS drill_result_photos (
      id TEXT PRIMARY KEY,
      drill_result_id TEXT NOT NULL REFERENCES drill_results(id) ON DELETE CASCADE,
      storage_url TEXT,
      storage_path TEXT,
      local_uri TEXT,
      upload_status TEXT NOT NULL DEFAULT 'pending',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS drill_result_photos_drill_result_id_idx
      ON drill_result_photos(drill_result_id);

    UPDATE drill_results
       SET photo_url = NULL
     WHERE photo_url IS NOT NULL
       AND (photo_url LIKE 'file://%'
            OR photo_url LIKE 'content://%'
            OR photo_url LIKE 'ph://%');

    UPDATE sessions
       SET photo_url = NULL
     WHERE photo_url IS NOT NULL
       AND (photo_url LIKE 'file://%'
            OR photo_url LIKE 'content://%'
            OR photo_url LIKE 'ph://%');

    DELETE FROM sync_queue
      WHERE table_name IN ('drill_results', 'sessions')
        AND (json_extract(payload, '$.photo_url') LIKE 'file://%'
             OR json_extract(payload, '$.photo_url') LIKE 'content://%'
             OR json_extract(payload, '$.photo_url') LIKE 'ph://%');
  `,
};
