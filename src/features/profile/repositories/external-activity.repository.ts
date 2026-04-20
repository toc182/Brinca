import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export interface ExternalActivityRow {
  id: string;
  child_id: string;
  name: string;
  schedule: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getExternalActivitiesByChild(
  childId: UUID
): Promise<ExternalActivityRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExternalActivityRow>(
    `SELECT * FROM external_activities WHERE child_id = ? ORDER BY created_at ASC`,
    childId
  );
}

export async function insertExternalActivity(
  id: UUID,
  childId: UUID,
  name: string,
  schedule: string | null,
  location: string | null,
  notes: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO external_activities (id, child_id, name, schedule, location, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    childId,
    name,
    schedule,
    location,
    notes
  );
}

export async function updateExternalActivity(
  id: UUID,
  fields: Partial<{
    name: string;
    schedule: string | null;
    location: string | null;
    notes: string | null;
  }>
): Promise<void> {
  const db = await getDatabase();
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, v]) => v);

  await db.runAsync(
    `UPDATE external_activities SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
    ...values,
    id
  );
}

export async function deleteExternalActivity(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM external_activities WHERE id = ?`, id);
}
