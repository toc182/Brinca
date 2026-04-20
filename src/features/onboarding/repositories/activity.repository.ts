import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function insertActivity(
  id: UUID,
  childId: UUID,
  name: string
) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO activities (id, child_id, name, display_order) VALUES (?, ?, ?, 0)`,
    id,
    childId,
    name
  );
}

export async function getActivitiesByChild(childId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    child_id: string;
    name: string;
  }>(`SELECT * FROM activities WHERE child_id = ? AND is_active = 1 ORDER BY display_order ASC`, childId);
}

export async function getFirstActivity(childId: UUID) {
  const db = await getDatabase();
  return db.getFirstAsync<{
    id: string;
    child_id: string;
    name: string;
  }>(`SELECT * FROM activities WHERE child_id = ? ORDER BY created_at ASC LIMIT 1`, childId);
}
