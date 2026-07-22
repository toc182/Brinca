import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

interface SessionRow {
  id: string;
  child_id: string;
  activity_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  photo_url: string | null;
  is_complete: number;
}

export async function insertSession(id: UUID, childId: UUID, activityId: UUID, startedAt: string) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sessions (id, child_id, activity_id, started_at) VALUES (?, ?, ?, ?)`,
    id, childId, activityId, startedAt
  );
  await appendToQueue('INSERT', 'sessions', { id, child_id: childId, activity_id: activityId, started_at: startedAt });
}

export async function getSessionById(id: UUID): Promise<SessionRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<SessionRow>(`SELECT * FROM sessions WHERE id = ?`, id);
}

export async function finishSession(id: UUID, endedAt: string, durationSeconds: number) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE sessions SET ended_at = ?, duration_seconds = ?, is_complete = 1 WHERE id = ?`,
    endedAt, durationSeconds, id
  );
  await appendToQueue('UPDATE', 'sessions', { id, ended_at: endedAt, duration_seconds: durationSeconds, is_complete: true });
}

/**
 * Discard an in-progress session entirely — the session never happened, so
 * this is a genuine hard delete, not a soft-delete tombstone. Deleting the
 * session row cascades locally (drill_results → element_values, session_photos,
 * drill_result_photos all FK with ON DELETE CASCADE), and a single queued
 * DELETE cascades the same way on Supabase. Any INSERT/UPDATE queue entries for
 * this session's rows that haven't drained yet replay harmlessly before the
 * DELETE lands (server briefly creates, then removes).
 */
export async function discardSession(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sessions WHERE id = ?`, id);
  await appendToQueue('DELETE', 'sessions', { id });
}

export async function updateSessionNote(id: UUID, note: string) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sessions SET note = ? WHERE id = ?`, note, id);
  await appendToQueue('UPDATE', 'sessions', { id, note });
}

/**
 * @deprecated Single-photo legacy column; session-level multi-photo lives in
 * the `session_photos` child table — use `insertLocalPhoto` from
 * `session-photo.repository.ts` plus the upload pipeline. This setter remains
 * only so historical callers compile; new code MUST NOT use it.
 */
export async function updateSessionPhoto(id: UUID, photoUrl: string | null) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sessions SET photo_url = ? WHERE id = ?`, photoUrl, id);
  await appendToQueue('UPDATE', 'sessions', { id, photo_url: photoUrl });
}

export async function getCompletedSessionCount(childId: UUID): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions WHERE child_id = ? AND is_complete = 1`, childId
  );
  return result?.count ?? 0;
}

export async function getCompletedSessionDates(childId: UUID): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ started_at: string }>(
    `SELECT started_at FROM sessions WHERE child_id = ? AND is_complete = 1 ORDER BY started_at DESC`, childId
  );
  return rows.map((r) => r.started_at);
}

export async function getRecentSessions(childId: UUID, limit: number) {
  const db = await getDatabase();
  return db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE child_id = ? AND is_complete = 1 ORDER BY started_at DESC LIMIT ?`,
    childId, limit
  );
}
