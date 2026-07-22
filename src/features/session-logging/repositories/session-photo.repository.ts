import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

export type UploadStatus = 'pending' | 'uploaded' | 'failed';

export interface SessionPhotoRow {
  id: string;
  session_id: string;
  storage_url: string | null;
  storage_path: string | null;
  local_uri: string | null;
  upload_status: UploadStatus;
  display_order: number;
  created_at: string;
}

/**
 * Insert a session photo row in the local "pending" state — before the upload
 * starts. The Supabase INSERT is NOT queued at this point because storage_url
 * is still null; queueing now would replay a broken row to a NOT-NULL column.
 * The upload pipeline (photo-upload-queue.ts) is responsible for queueing the
 * INSERT only after the upload returns a real public URL.
 */
export async function insertLocalPhoto(
  sessionId: UUID,
  localUri: string,
): Promise<SessionPhotoRow> {
  const db = await getDatabase();
  const id = randomUUID();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM session_photos WHERE session_id = ?`,
    sessionId,
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO session_photos (id, session_id, local_uri, upload_status, display_order)
     VALUES (?, ?, ?, 'pending', ?)`,
    id, sessionId, localUri, displayOrder,
  );

  const row = await db.getFirstAsync<SessionPhotoRow>(
    `SELECT * FROM session_photos WHERE id = ?`,
    id,
  );
  if (!row) throw new Error('session_photo row missing after insert');
  return row;
}

/**
 * Mark a session photo's upload as succeeded: write the storage_url +
 * storage_path, flip status to 'uploaded', and queue the Supabase INSERT with
 * the parsed object shape (per the JSONB-stringify convention — pass objects,
 * not stringified strings, to appendToQueue).
 */
export async function markPhotoUploaded(
  id: UUID,
  storageUrl: string,
  storagePath: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE session_photos
       SET storage_url = ?, storage_path = ?, upload_status = 'uploaded'
     WHERE id = ?`,
    storageUrl, storagePath, id,
  );
  const row = await db.getFirstAsync<SessionPhotoRow>(
    `SELECT * FROM session_photos WHERE id = ?`,
    id,
  );
  if (!row) return;
  await appendToQueue('INSERT', 'session_photos', {
    id: row.id,
    session_id: row.session_id,
    storage_url: row.storage_url,
    storage_path: row.storage_path,
    display_order: row.display_order,
  });
}

export async function markPhotoFailed(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE session_photos SET upload_status = 'failed' WHERE id = ?`,
    id,
  );
}

/**
 * Reset a failed photo back to 'pending' so the next upload pass picks it up.
 */
export async function markPhotoPending(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE session_photos SET upload_status = 'pending' WHERE id = ?`,
    id,
  );
}

/**
 * Delete a session photo: drops the local row and queues the Supabase DELETE.
 * Storage object cleanup is the caller's responsibility (best-effort).
 */
export async function deletePhoto(id: UUID): Promise<{ storagePath: string | null }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionPhotoRow>(
    `SELECT * FROM session_photos WHERE id = ?`,
    id,
  );
  if (!row) return { storagePath: null };

  if (row.upload_status === 'uploaded') {
    // On the server → soft-delete so the tombstone reaches other devices.
    const deletedAt = new Date().toISOString();
    await db.runAsync(`UPDATE session_photos SET deleted_at = ? WHERE id = ?`, deletedAt, id);
    await appendToQueue('UPDATE', 'session_photos', { id, deleted_at: deletedAt });
  } else {
    // Never uploaded → nothing on the server to propagate; hard-delete locally.
    await db.runAsync(`DELETE FROM session_photos WHERE id = ?`, id);
  }
  return { storagePath: row.storage_path };
}

export async function getPhotosBySession(sessionId: UUID): Promise<SessionPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionPhotoRow>(
    `SELECT * FROM session_photos
       WHERE session_id = ? AND deleted_at IS NULL
     ORDER BY display_order ASC, created_at ASC`,
    sessionId,
  );
}

/**
 * All session_photo rows that need an upload attempt — pending or previously
 * failed. Used by the background upload drainer.
 */
export async function getPendingUploads(): Promise<SessionPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionPhotoRow>(
    `SELECT * FROM session_photos
       WHERE upload_status IN ('pending', 'failed')
         AND local_uri IS NOT NULL
     ORDER BY created_at ASC`,
  );
}
