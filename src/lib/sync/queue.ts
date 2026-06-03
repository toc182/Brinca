import { getDatabase } from '../sqlite/db';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
type SyncStatus = 'pending' | 'in_flight' | 'failed';

// After this many consecutive failures on a single queue item, the drainer
// stops retrying it and moves on to the next pending row. The bad row stays
// in sync_queue (with last_error populated) so it can be inspected and
// either re-tried manually or dropped, but it no longer blocks every later
// item from syncing — fixes the head-of-line problem from the audit.
export const MAX_RETRIES = 10;

interface QueueEntry {
  id: number;
  operation: SyncOperation;
  table_name: string;
  payload: string;
  status: SyncStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
}

export async function appendToQueue(operation: SyncOperation, tableName: string, payload: Record<string, unknown>) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (operation, table_name, payload) VALUES (?, ?, ?)`,
    operation, tableName, JSON.stringify(payload)
  );
}

export async function getNextPending(): Promise<QueueEntry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<QueueEntry>(
    `SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') AND retry_count < ? ORDER BY id ASC LIMIT 1`,
    MAX_RETRIES
  );
}

export async function markInFlight(id: number) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sync_queue SET status = 'in_flight' WHERE id = ?`, id);
}

export async function markComplete(id: number) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id);
  // Self-heal: a successful sync proves the dependency landscape changed
  // (e.g. a previously-missing parent just landed in Supabase). Give every
  // failed row another epoch's worth of retries. MAX_RETRIES still caps any
  // genuinely-broken row.
  await db.runAsync(
    `UPDATE sync_queue SET status = 'pending', retry_count = 0, last_error = NULL WHERE status = 'failed'`
  );
}

export async function markFailed(id: number, error: string) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE sync_queue SET status = 'failed', retry_count = retry_count + 1, last_error = ? WHERE id = ?`,
    error, id
  );
}

export async function resetStaleInFlight() {
  const db = await getDatabase();
  // Reset both in-flight (interrupted mid-sync) AND failed (stuck at the
  // retry cap from a previous app session) so they get one fresh epoch on
  // startup. Without this, dependency-chain casualties stay buried forever
  // even after the underlying issue resolves.
  await db.runAsync(
    `UPDATE sync_queue
       SET status = 'pending',
           retry_count = CASE WHEN status = 'failed' THEN 0 ELSE retry_count END,
           last_error = CASE WHEN status = 'failed' THEN NULL ELSE last_error END
       WHERE status IN ('in_flight', 'failed')`
  );
}

export async function getPendingCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')`
  );
  return result?.count ?? 0;
}
