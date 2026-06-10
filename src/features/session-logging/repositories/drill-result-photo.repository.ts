import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

export type UploadStatus = 'pending' | 'uploaded' | 'failed';

export interface DrillResultPhotoRow {
  id: string;
  drill_result_id: string;
  storage_url: string | null;
  storage_path: string | null;
  local_uri: string | null;
  upload_status: UploadStatus;
  display_order: number;
  created_at: string;
}

/**
 * Insert a photo row in the local "pending" state — before the upload starts.
 * The Supabase INSERT is NOT queued at this point because storage_url is still
 * null; queueing now would replay a broken row to a NOT-NULL column. The
 * upload pipeline (photo-upload-queue.ts) is responsible for queueing the
 * INSERT only after the upload returns a real public URL.
 */
export async function insertLocalPhoto(
  drillResultId: UUID,
  localUri: string,
): Promise<DrillResultPhotoRow> {
  const db = await getDatabase();
  const id = randomUUID();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM drill_result_photos WHERE drill_result_id = ?`,
    drillResultId,
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO drill_result_photos (id, drill_result_id, local_uri, upload_status, display_order)
     VALUES (?, ?, ?, 'pending', ?)`,
    id, drillResultId, localUri, displayOrder,
  );

  const row = await db.getFirstAsync<DrillResultPhotoRow>(
    `SELECT * FROM drill_result_photos WHERE id = ?`,
    id,
  );
  if (!row) throw new Error('photo row missing after insert');
  return row;
}

/**
 * Mark a photo's upload as succeeded: write the storage_url + storage_path,
 * flip status to 'uploaded', and queue the Supabase INSERT with the parsed
 * object shape (per the JSONB-stringify lessons — never send a stringified
 * payload to a JSONB column elsewhere; here it doesn't matter but the parsed
 * object shape is the convention we follow).
 */
export async function markPhotoUploaded(
  id: UUID,
  storageUrl: string,
  storagePath: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE drill_result_photos
       SET storage_url = ?, storage_path = ?, upload_status = 'uploaded'
     WHERE id = ?`,
    storageUrl, storagePath, id,
  );
  const row = await db.getFirstAsync<DrillResultPhotoRow>(
    `SELECT * FROM drill_result_photos WHERE id = ?`,
    id,
  );
  if (!row) return;
  await appendToQueue('INSERT', 'drill_result_photos', {
    id: row.id,
    drill_result_id: row.drill_result_id,
    storage_url: row.storage_url,
    storage_path: row.storage_path,
    display_order: row.display_order,
  });
}

export async function markPhotoFailed(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE drill_result_photos SET upload_status = 'failed' WHERE id = ?`,
    id,
  );
}

/**
 * Reset a failed photo back to 'pending' so the next upload pass picks it up.
 */
export async function markPhotoPending(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE drill_result_photos SET upload_status = 'pending' WHERE id = ?`,
    id,
  );
}

/**
 * Delete a photo: drops the local row and queues the Supabase DELETE. The
 * storage object cleanup is the caller's responsibility (best-effort), since
 * it lives outside SQL and shouldn't block local state changes.
 */
export async function deletePhoto(id: UUID): Promise<{ storagePath: string | null }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DrillResultPhotoRow>(
    `SELECT * FROM drill_result_photos WHERE id = ?`,
    id,
  );
  if (!row) return { storagePath: null };

  await db.runAsync(`DELETE FROM drill_result_photos WHERE id = ?`, id);

  // Only queue the Supabase DELETE if the row was actually synced (status =
  // 'uploaded'). A row that never uploaded has no Supabase counterpart, so
  // there's nothing to delete remotely.
  if (row.upload_status === 'uploaded') {
    await appendToQueue('DELETE', 'drill_result_photos', { id });
  }
  return { storagePath: row.storage_path };
}

export async function getPhotosByDrillResult(drillResultId: UUID): Promise<DrillResultPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<DrillResultPhotoRow>(
    `SELECT * FROM drill_result_photos
       WHERE drill_result_id = ?
     ORDER BY display_order ASC, created_at ASC`,
    drillResultId,
  );
}

/**
 * All rows that need an upload attempt — pending or previously failed.
 * Used by the background upload drainer.
 */
export async function getPendingUploads(): Promise<DrillResultPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<DrillResultPhotoRow>(
    `SELECT * FROM drill_result_photos
       WHERE upload_status IN ('pending', 'failed')
         AND local_uri IS NOT NULL
     ORDER BY created_at ASC`,
  );
}
