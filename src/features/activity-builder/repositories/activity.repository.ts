import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

interface ActivityRow {
  id: string;
  child_id: string;
  name: string;
  icon: string | null;
  category: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getActivitiesByChild(childId: UUID): Promise<ActivityRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityRow>(
    `SELECT * FROM activities WHERE child_id = ? ORDER BY display_order ASC`,
    childId
  );
}

export async function getActivityById(id: UUID): Promise<ActivityRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ActivityRow>(`SELECT * FROM activities WHERE id = ?`, id);
}

export async function insertActivity(id: UUID, childId: UUID, name: string, icon?: string, category?: string) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM activities WHERE child_id = ?`, childId
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;
  await db.runAsync(
    `INSERT INTO activities (id, child_id, name, icon, category, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
    id, childId, name, icon ?? null, category ?? null, displayOrder
  );
  await appendToQueue('INSERT', 'activities', { id, child_id: childId, name, icon: icon ?? null, category: category ?? null, display_order: displayOrder });
}

export async function updateActivity(id: UUID, fields: { name?: string; icon?: string; category?: string; is_active?: boolean }) {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
  if (fields.icon !== undefined) { sets.push('icon = ?'); values.push(fields.icon); }
  if (fields.category !== undefined) { sets.push('category = ?'); values.push(fields.category); }
  if (fields.is_active !== undefined) { sets.push('is_active = ?'); values.push(fields.is_active ? 1 : 0); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE activities SET ${sets.join(', ')} WHERE id = ?`, ...values);
  const payload: Record<string, unknown> = { id };
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.icon !== undefined) payload.icon = fields.icon;
  if (fields.category !== undefined) payload.category = fields.category;
  if (fields.is_active !== undefined) payload.is_active = fields.is_active ? 1 : 0;
  await appendToQueue('UPDATE', 'activities', payload);
}

export async function deleteActivity(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM activities WHERE id = ?`, id);
  await appendToQueue('DELETE', 'activities', { id });
}
