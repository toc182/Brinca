import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

interface TierRewardRow {
  id: string;
  parent_type: string;
  parent_id: string;
  name: string;
  conditions: string;
  currency_amount: number;
  display_order: number;
}

export async function getTierRewards(parentType: string, parentId: UUID): Promise<TierRewardRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<TierRewardRow>(
    `SELECT * FROM tier_rewards WHERE parent_type = ? AND parent_id = ? ORDER BY display_order ASC`,
    parentType, parentId
  );
}

export async function insertTierReward(id: UUID, parentType: string, parentId: UUID, name: string, conditions: unknown[], currencyAmount: number) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM tier_rewards WHERE parent_type = ? AND parent_id = ?`, parentType, parentId
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;
  const conditionsJson = JSON.stringify(conditions);
  await db.runAsync(
    `INSERT INTO tier_rewards (id, parent_type, parent_id, name, conditions, currency_amount, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, parentType, parentId, name, conditionsJson, currencyAmount, displayOrder
  );
  await appendToQueue('INSERT', 'tier_rewards', { id, parent_type: parentType, parent_id: parentId, name, conditions: conditionsJson, currency_amount: currencyAmount, display_order: displayOrder });
}

export async function updateTierReward(id: UUID, fields: { name?: string; conditions?: unknown[]; currency_amount?: number }) {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
  if (fields.conditions !== undefined) { sets.push('conditions = ?'); values.push(JSON.stringify(fields.conditions)); }
  if (fields.currency_amount !== undefined) { sets.push('currency_amount = ?'); values.push(fields.currency_amount); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE tier_rewards SET ${sets.join(', ')} WHERE id = ?`, ...values);
  const payload: Record<string, unknown> = { id };
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.conditions !== undefined) payload.conditions = JSON.stringify(fields.conditions);
  if (fields.currency_amount !== undefined) payload.currency_amount = fields.currency_amount;
  await appendToQueue('UPDATE', 'tier_rewards', payload);
}

export async function deleteTierReward(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM tier_rewards WHERE id = ?`, id);
  await appendToQueue('DELETE', 'tier_rewards', { id });
}
