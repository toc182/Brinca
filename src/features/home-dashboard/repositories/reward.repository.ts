import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function insertReward(id: UUID, childId: UUID, name: string, cost: number) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO rewards (id, child_id, name, cost) VALUES (?, ?, ?, ?)`,
    id, childId, name, cost
  );
}

export async function getRewardsByChild(childId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; name: string; cost: number; state: string; redeemed_at: string | null }>(
    `SELECT * FROM rewards WHERE child_id = ? ORDER BY created_at DESC`, childId
  );
}

export async function updateRewardState(id: UUID, state: string, redeemedAt?: string) {
  const db = await getDatabase();
  if (redeemedAt) {
    await db.runAsync(`UPDATE rewards SET state = ?, redeemed_at = ? WHERE id = ?`, state, redeemedAt, id);
  } else {
    await db.runAsync(`UPDATE rewards SET state = ? WHERE id = ?`, state, id);
  }
}

export async function deleteReward(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM rewards WHERE id = ?`, id);
}
