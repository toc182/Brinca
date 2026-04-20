import { getDatabase } from '@/lib/sqlite/db';
import type { UUID, MeasurementType } from '@/types/domain.types';

export interface MeasurementRow {
  id: string;
  child_id: string;
  type: string;
  value: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export async function getMeasurementsByChild(
  childId: UUID,
  type: MeasurementType
): Promise<MeasurementRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<MeasurementRow>(
    `SELECT * FROM measurements WHERE child_id = ? AND type = ? ORDER BY date DESC`,
    childId,
    type
  );
}

export async function insertMeasurement(
  id: UUID,
  childId: UUID,
  type: MeasurementType,
  value: number,
  date: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO measurements (id, child_id, type, value, date) VALUES (?, ?, ?, ?, ?)`,
    id,
    childId,
    type,
    value,
    date
  );
}

export async function deleteMeasurement(id: UUID): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM measurements WHERE id = ?`, id);
}
