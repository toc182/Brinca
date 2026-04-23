import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

interface DrillRow {
  id: string;
  activity_id: string;
  name: string;
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

export async function insertDrill(id: UUID, activityId: UUID, name: string) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM drills WHERE activity_id = ?`, activityId
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;
  await db.runAsync(
    `INSERT INTO drills (id, activity_id, name, display_order) VALUES (?, ?, ?, ?)`,
    id, activityId, name, displayOrder
  );
  await appendToQueue('INSERT', 'drills', { id, activity_id: activityId, name, display_order: displayOrder });
}

export async function updateDrill(id: UUID, fields: { name?: string; is_active?: boolean }) {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
  if (fields.is_active !== undefined) { sets.push('is_active = ?'); values.push(fields.is_active ? 1 : 0); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE drills SET ${sets.join(', ')} WHERE id = ?`, ...values);
  const payload: Record<string, unknown> = { id };
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.is_active !== undefined) payload.is_active = fields.is_active ? 1 : 0;
  await appendToQueue('UPDATE', 'drills', payload);
}

export async function deleteDrill(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM drills WHERE id = ?`, id);
  await appendToQueue('DELETE', 'drills', { id });
}

export async function reorderDrills(drillIds: UUID[]) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < drillIds.length; i++) {
      await db.runAsync(`UPDATE drills SET display_order = ? WHERE id = ?`, i, drillIds[i]);
    }
  });
  for (let i = 0; i < drillIds.length; i++) {
    await appendToQueue('UPDATE', 'drills', { id: drillIds[i], display_order: i });
  }
}
