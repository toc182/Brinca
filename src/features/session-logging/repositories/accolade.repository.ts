import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

export async function insertAccoladeUnlock(childId: UUID, accoladeId: string) {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO accolade_unlocks (child_id, accolade_id) VALUES (?, ?)`,
    childId, accoladeId
  );
  // INSERT OR IGNORE is a no-op when the row already exists locally; only
  // queue the change when a row was actually inserted, so we don't push
  // duplicate INSERTs that the server will reject on its own unique-key.
  if (result.changes > 0) {
    await appendToQueue('INSERT', 'accolade_unlocks', {
      child_id: childId,
      accolade_id: accoladeId,
    });
  }
}

export async function getUnlockedAccolades(childId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{ child_id: string; accolade_id: string; unlocked_at: string }>(
    `SELECT * FROM accolade_unlocks WHERE child_id = ? ORDER BY unlocked_at DESC`, childId
  );
}

export async function isAccoladeUnlocked(childId: UUID, accoladeId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ child_id: string }>(
    `SELECT child_id FROM accolade_unlocks WHERE child_id = ? AND accolade_id = ?`, childId, accoladeId
  );
  return result !== null;
}
