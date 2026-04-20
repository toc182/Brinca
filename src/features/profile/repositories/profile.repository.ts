import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export interface ChildRow {
  id: string;
  family_id: string;
  name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  grade_level: string | null;
  school_calendar: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementRow {
  id: string;
  child_id: string;
  type: string;
  value: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ActivitySummaryRow {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
  is_active: number;
}

export interface ChildrenListRow {
  id: string;
  family_id: string;
  name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
}

export async function getChildById(childId: UUID): Promise<ChildRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ChildRow>(
    `SELECT * FROM children WHERE id = ?`,
    childId
  );
}

export async function getChildrenByFamily(familyId: UUID): Promise<ChildrenListRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<ChildrenListRow>(
    `SELECT id, family_id, name, avatar_url, date_of_birth
     FROM children WHERE family_id = ? ORDER BY created_at ASC`,
    familyId
  );
}

export async function getLatestMeasurement(
  childId: UUID,
  type: 'weight' | 'height'
): Promise<MeasurementRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<MeasurementRow>(
    `SELECT * FROM measurements WHERE child_id = ? AND type = ? ORDER BY date DESC LIMIT 1`,
    childId,
    type
  );
}

export async function getActivitiesSummary(childId: UUID): Promise<ActivitySummaryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivitySummaryRow>(
    `SELECT id, name, icon, category, is_active
     FROM activities WHERE child_id = ? AND is_active = 1
     ORDER BY display_order ASC LIMIT 5`,
    childId
  );
}

export async function updateChild(
  childId: UUID,
  fields: Partial<{
    name: string;
    date_of_birth: string;
    gender: string;
    country: string;
    grade_level: string;
    avatar_url: string;
  }>
): Promise<void> {
  const db = await getDatabase();
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, v]) => v);

  await db.runAsync(
    `UPDATE children SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
    ...values,
    childId
  );
}
