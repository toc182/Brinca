import { getDatabase } from '@/lib/sqlite/db';
import { deleteStorageObject } from '@/lib/sync/photo-upload-queue';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

export interface DrillRow {
  id: string;
  activity_id: string;
  name: string;
  description: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getDrillsByActivity(activityId: UUID): Promise<DrillRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<DrillRow>(
    `SELECT * FROM drills WHERE activity_id = ? ORDER BY display_order ASC`,
    activityId
  );
}

export async function getDrillById(id: UUID): Promise<DrillRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DrillRow>(`SELECT * FROM drills WHERE id = ?`, id);
}

export async function insertDrill(
  id: UUID,
  activityId: UUID,
  name: string,
  description: string | null = null,
) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM drills WHERE activity_id = ?`, activityId
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;
  await db.runAsync(
    `INSERT INTO drills (id, activity_id, name, description, display_order) VALUES (?, ?, ?, ?, ?)`,
    id, activityId, name, description, displayOrder
  );
  await appendToQueue('INSERT', 'drills', {
    id,
    activity_id: activityId,
    name,
    description,
    display_order: displayOrder,
  });
}

export async function updateDrill(
  id: UUID,
  fields: { name?: string; is_active?: boolean; description?: string | null },
) {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
  if (fields.is_active !== undefined) { sets.push('is_active = ?'); values.push(fields.is_active ? 1 : 0); }
  // `description: null` is meaningful — it clears an existing description.
  // Distinguish "field omitted" from "field set to null" via `in` check.
  if ('description' in fields) { sets.push('description = ?'); values.push(fields.description ?? null); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE drills SET ${sets.join(', ')} WHERE id = ?`, ...values);
  const payload: Record<string, unknown> = { id };
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.is_active !== undefined) payload.is_active = fields.is_active ? 1 : 0;
  if ('description' in fields) payload.description = fields.description ?? null;
  await appendToQueue('UPDATE', 'drills', payload);
}

export async function deleteDrill(id: UUID) {
  const db = await getDatabase();
  // Best-effort Storage cleanup of any drill_photos objects before the
  // SQLite CASCADE removes the rows. Supabase's FK CASCADE handles the
  // server-side rows but doesn't touch Storage objects — same blind spot
  // as drill_result_photos and session_photos.
  const photoRows = await db.getAllAsync<{ storage_path: string | null }>(
    `SELECT storage_path FROM drill_photos WHERE drill_id = ? AND storage_path IS NOT NULL`,
    id,
  );
  for (const row of photoRows) {
    if (row.storage_path) void deleteStorageObject(row.storage_path);
  }
  await db.runAsync(`DELETE FROM drills WHERE id = ?`, id);
  await appendToQueue('DELETE', 'drills', { id });
}

export async function reorderDrills(drillIds: UUID[]) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < drillIds.length; i++) {
      await db.runAsync(`UPDATE drills SET display_order = ? WHERE id = ?`, i, drillIds[i]);
      await appendToQueue('UPDATE', 'drills', { id: drillIds[i], display_order: i });
    }
  });
}
