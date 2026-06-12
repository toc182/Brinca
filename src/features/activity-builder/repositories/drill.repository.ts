import { getDatabase } from '@/lib/sqlite/db';
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
    `SELECT * FROM drills WHERE activity_id = ? AND deleted_at IS NULL ORDER BY display_order ASC`,
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

/**
 * Soft delete: stamps deleted_at instead of removing the row. drill_results
 * reference drills with no ON DELETE rule (locally and on Supabase), so a
 * hard DELETE fails for any drill with logged session data — and stats
 * screens resolve drill names from this row for that history anyway.
 * Description photos stay in Storage since the row (and its history) lives on.
 */
export async function deleteDrill(id: UUID) {
  const db = await getDatabase();
  const deletedAt = new Date().toISOString();
  await db.runAsync(`UPDATE drills SET deleted_at = ? WHERE id = ?`, deletedAt, id);
  await appendToQueue('UPDATE', 'drills', { id, deleted_at: deletedAt });
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
