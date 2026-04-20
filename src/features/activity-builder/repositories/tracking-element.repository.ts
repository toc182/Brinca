import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

interface TrackingElementRow {
  id: string;
  drill_id: string;
  type: string;
  label: string;
  config: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getElementsByDrill(drillId: UUID): Promise<TrackingElementRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<TrackingElementRow>(
    `SELECT * FROM tracking_elements WHERE drill_id = ? ORDER BY display_order ASC`,
    drillId
  );
}

export async function insertElement(id: UUID, drillId: UUID, type: string, label: string, config: Record<string, unknown>) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM tracking_elements WHERE drill_id = ?`, drillId
  );
  await db.runAsync(
    `INSERT INTO tracking_elements (id, drill_id, type, label, config, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
    id, drillId, type, label, JSON.stringify(config), (maxOrder?.m ?? -1) + 1
  );
}

export async function updateElement(id: UUID, fields: { label?: string; config?: Record<string, unknown> }) {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.label !== undefined) { sets.push('label = ?'); values.push(fields.label); }
  if (fields.config !== undefined) { sets.push('config = ?'); values.push(JSON.stringify(fields.config)); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE tracking_elements SET ${sets.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteElement(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM tracking_elements WHERE id = ?`, id);
}
