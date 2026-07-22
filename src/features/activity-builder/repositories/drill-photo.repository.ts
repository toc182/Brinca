import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

export type UploadStatus = 'pending' | 'uploaded' | 'failed';

export interface DrillPhotoRow {
  id: string;
  drill_id: string;
  storage_url: string | null;
  storage_path: string | null;
  local_uri: string | null;
  upload_status: UploadStatus;
  display_order: number;
  created_at: string;
}

/**
 * Insert a drill-description photo row in the local "pending" state — before
 * the upload starts. The Supabase INSERT is NOT queued here because
 * storage_url is still null; queueing now would replay a broken row to a
 * NOT-NULL column. The upload pipeline (photo-upload-queue.ts) queues the
 * INSERT only after the upload returns a real public URL.
 */
export async function insertLocalPhoto(
  drillId: UUID,
  localUri: string,
): Promise<DrillPhotoRow> {
  const db = await getDatabase();
  const id = randomUUID();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM drill_photos WHERE drill_id = ?`,
    drillId,
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO drill_photos (id, drill_id, local_uri, upload_status, display_order)
     VALUES (?, ?, ?, 'pending', ?)`,
    id, drillId, localUri, displayOrder,
  );

  const row = await db.getFirstAsync<DrillPhotoRow>(
    `SELECT * FROM drill_photos WHERE id = ?`,
    id,
  );
  if (!row) throw new Error('drill_photo row missing after insert');
  return row;
}

/**
 * Mark a drill-description photo's upload as succeeded: write storage_url +
 * storage_path, flip status to 'uploaded', and queue the Supabase INSERT
 * with the parsed object shape (per the JSONB-stringify convention — pass
 * objects, not stringified strings, to appendToQueue).
 */
export async function markPhotoUploaded(
  id: UUID,
  storageUrl: string,
  storagePath: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE drill_photos
       SET storage_url = ?, storage_path = ?, upload_status = 'uploaded'
     WHERE id = ?`,
    storageUrl, storagePath, id,
  );
  const row = await db.getFirstAsync<DrillPhotoRow>(
    `SELECT * FROM drill_photos WHERE id = ?`,
    id,
  );
  if (!row) return;
  await appendToQueue('INSERT', 'drill_photos', {
    id: row.id,
    drill_id: row.drill_id,
    storage_url: row.storage_url,
    storage_path: row.storage_path,
    display_order: row.display_order,
  });
}

export async function markPhotoFailed(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE drill_photos SET upload_status = 'failed' WHERE id = ?`,
    id,
  );
}

/**
 * Reset a failed photo back to 'pending' so the next upload pass picks it up.
 */
export async function markPhotoPending(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE drill_photos SET upload_status = 'pending' WHERE id = ?`,
    id,
  );
}

/**
 * Delete a drill-description photo: drops the local row and queues the
 * Supabase DELETE. Storage object cleanup is the caller's responsibility
 * (best-effort).
 */
export async function deletePhoto(id: UUID): Promise<{ storagePath: string | null }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DrillPhotoRow>(
    `SELECT * FROM drill_photos WHERE id = ?`,
    id,
  );
  if (!row) return { storagePath: null };

  if (row.upload_status === 'uploaded') {
    // On the server → soft-delete so the tombstone reaches other devices.
    const deletedAt = new Date().toISOString();
    await db.runAsync(`UPDATE drill_photos SET deleted_at = ? WHERE id = ?`, deletedAt, id);
    await appendToQueue('UPDATE', 'drill_photos', { id, deleted_at: deletedAt });
  } else {
    // Never uploaded → the server never had it, so hard-delete locally with
    // nothing to propagate.
    await db.runAsync(`DELETE FROM drill_photos WHERE id = ?`, id);
  }
  return { storagePath: row.storage_path };
}

/**
 * Drill ids that have at least one description photo. Cheap DISTINCT scan;
 * used by SessionScreen to know which rows should surface the info icon
 * without paying the per-drill signed-URL cost up-front.
 */
export async function getDrillIdsWithPhotos(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ drill_id: string }>(
    `SELECT DISTINCT drill_id FROM drill_photos WHERE deleted_at IS NULL`,
  );
  return new Set(rows.map((r) => r.drill_id));
}

export async function getPhotosByDrill(drillId: UUID): Promise<DrillPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<DrillPhotoRow>(
    `SELECT * FROM drill_photos
       WHERE drill_id = ? AND deleted_at IS NULL
     ORDER BY display_order ASC, created_at ASC`,
    drillId,
  );
}

/**
 * All drill_photo rows that need an upload attempt — pending or previously
 * failed. Used by the background upload drainer.
 */
export async function getPendingUploads(): Promise<DrillPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<DrillPhotoRow>(
    `SELECT * FROM drill_photos
       WHERE upload_status IN ('pending', 'failed')
         AND local_uri IS NOT NULL
     ORDER BY created_at ASC`,
  );
}
