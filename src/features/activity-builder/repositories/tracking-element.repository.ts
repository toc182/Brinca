import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { ElementWidth } from '@/shared/tracking-elements/types/element-types';
import type { UUID } from '@/types/domain.types';

interface TrackingElementRow {
  id: string;
  drill_id: string;
  type: string;
  label: string;
  config: string;
  width: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getElementsByDrill(drillId: UUID): Promise<TrackingElementRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<TrackingElementRow>(
    `SELECT * FROM tracking_elements WHERE drill_id = ? AND deleted_at IS NULL ORDER BY display_order ASC`,
    drillId
  );
}

export async function insertElement(
  id: UUID,
  drillId: UUID,
  type: string,
  label: string,
  config: Record<string, unknown>,
  width: ElementWidth = 'full',
) {
  const db = await getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(display_order), -1) as m FROM tracking_elements WHERE drill_id = ?`, drillId
  );
  const displayOrder = (maxOrder?.m ?? -1) + 1;
  const configJson = JSON.stringify(config);
  await db.runAsync(
    `INSERT INTO tracking_elements (id, drill_id, type, label, config, width, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, drillId, type, label, configJson, width, displayOrder
  );
  // Sync payload carries the parsed object — Supabase's JSONB column expects
  // a JSON value, not a JSON-as-string. Local SQLite still stores the string.
  await appendToQueue('INSERT', 'tracking_elements', { id, drill_id: drillId, type, label, config, width, display_order: displayOrder });
}

export async function updateElement(id: UUID, fields: { label?: string; config?: Record<string, unknown>; width?: ElementWidth }) {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.label !== undefined) { sets.push('label = ?'); values.push(fields.label); }
  if (fields.config !== undefined) { sets.push('config = ?'); values.push(JSON.stringify(fields.config)); }
  if (fields.width !== undefined) { sets.push('width = ?'); values.push(fields.width); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE tracking_elements SET ${sets.join(', ')} WHERE id = ?`, ...values);
  const payload: Record<string, unknown> = { id };
  if (fields.label !== undefined) payload.label = fields.label;
  if (fields.config !== undefined) payload.config = fields.config;
  if (fields.width !== undefined) payload.width = fields.width;
  await appendToQueue('UPDATE', 'tracking_elements', payload);
}

/**
 * Soft delete: element_values reference tracking_elements with no ON DELETE
 * rule (locally and on Supabase), so a hard DELETE fails once the element
 * has logged session data — and stats label that history from this row.
 * Same pattern as activities/drills.
 */
export async function deleteElement(id: UUID) {
  const db = await getDatabase();
  const deletedAt = new Date().toISOString();
  await db.runAsync(`UPDATE tracking_elements SET deleted_at = ? WHERE id = ?`, deletedAt, id);
  await appendToQueue('UPDATE', 'tracking_elements', { id, deleted_at: deletedAt });
}

export async function reorderElements(elementIds: UUID[]) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < elementIds.length; i++) {
      await db.runAsync(`UPDATE tracking_elements SET display_order = ? WHERE id = ?`, i, elementIds[i]);
      await appendToQueue('UPDATE', 'tracking_elements', { id: elementIds[i], display_order: i });
    }
  });
}
