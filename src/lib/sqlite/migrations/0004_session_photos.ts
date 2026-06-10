/**
 * Migration 0004: Multi-photo support for sessions.
 *
 * Parallel to 0003_drill_result_photos but parented on sessions instead of
 * drill_results. Carries the same three device-only columns: `local_uri` (the
 * picker URI, kept until upload confirms), `upload_status` ('pending' |
 * 'uploaded' | 'failed'), and nullable storage_url/storage_path (they're
 * NOT NULL on Supabase, but a row exists locally before the upload returns a
 * public URL).
 *
 * The broken legacy sessions.photo_url cleanup was already done by migration
 * 0003 — no need to repeat here.
 *
 * Idempotent — no-op for fresh installs (CREATE TABLE IF NOT EXISTS).
 */
export const migration = {
  version: 4,
  sql: `
    CREATE TABLE IF NOT EXISTS session_photos (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      storage_url TEXT,
      storage_path TEXT,
      local_uri TEXT,
      upload_status TEXT NOT NULL DEFAULT 'pending',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS session_photos_session_id_idx
      ON session_photos(session_id);
  `,
};
