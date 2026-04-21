import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

export async function insertChild(
  id: UUID,
  familyId: UUID,
  name: string,
  dateOfBirth: string,
  gender: string,
  avatarUrl?: string | null
) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO children (id, family_id, name, date_of_birth, gender, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    familyId,
    name,
    dateOfBirth,
    gender,
    avatarUrl ?? null
  );
  await appendToQueue('INSERT', 'children', { id, family_id: familyId, name, date_of_birth: dateOfBirth, gender, avatar_url: avatarUrl ?? null });
}

export async function getChildrenByFamily(familyId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    family_id: string;
    name: string;
    date_of_birth: string | null;
    avatar_url: string | null;
  }>(`SELECT * FROM children WHERE family_id = ? ORDER BY created_at ASC`, familyId);
}

export async function getFirstChild(familyId: UUID) {
  const db = await getDatabase();
  return db.getFirstAsync<{
    id: string;
    family_id: string;
    name: string;
  }>(`SELECT * FROM children WHERE family_id = ? ORDER BY created_at ASC LIMIT 1`, familyId);
}
