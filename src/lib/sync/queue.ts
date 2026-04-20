import { getDatabase } from '../sqlite/db';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
type SyncStatus = 'pending' | 'in_flight' | 'failed';

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
    `SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY id ASC LIMIT 1`
  );
}

export async function markInFlight(id: number) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sync_queue SET status = 'in_flight' WHERE id = ?`, id);
}

export async function markComplete(id: number) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id);
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
  await db.runAsync(`UPDATE sync_queue SET status = 'pending' WHERE status = 'in_flight'`);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')`
  );
  return result?.count ?? 0;
}
