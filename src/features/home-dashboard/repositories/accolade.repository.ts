import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function insertAccoladeUnlock(childId: UUID, accoladeId: string) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO accolade_unlocks (child_id, accolade_id) VALUES (?, ?)`,
    childId, accoladeId
  );
}

export async function isAccoladeUnlocked(childId: UUID, accoladeId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ child_id: string }>(
    `SELECT child_id FROM accolade_unlocks WHERE child_id = ? AND accolade_id = ?`, childId, accoladeId
  );
  return result !== null;
}