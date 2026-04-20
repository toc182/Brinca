import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

interface BonusPresetRow {
  id: string;
  parent_type: string;
  parent_id: string;
  amount: number;
  display_order: number;
}

export async function getBonusPresets(parentType: string, parentId: UUID): Promise<BonusPresetRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<BonusPresetRow>(
    `SELECT * FROM bonus_presets WHERE parent_type = ? AND parent_id = ? ORDER BY display_order ASC`,
    parentType, parentId
  );
}

export async function insertBonusPreset(id: UUID, parentType: string, parentId: UUID, amount: number) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM bonus_presets WHERE parent_type = ? AND parent_id = ?`, parentType, parentId
  );
  await db.runAsync(
    `INSERT INTO bonus_presets (id, parent_type, parent_id, amount, display_order) VALUES (?, ?, ?, ?, ?)`,
    id, parentType, parentId, amount, (maxOrder?.m ?? -1) + 1
  );
}

export async function deleteBonusPreset(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM bonus_presets WHERE id = ?`, id);
}
