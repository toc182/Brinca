import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID } from '@/types/domain.types';

/**
 * Returns the existing drill_result id for the given session+drill,
 * or creates a new one and returns its id. Prevents duplicate rows when
 * a completed drill is reopened.
 */
export async function getOrCreateDrillResult(sessionId: UUID, drillId: UUID): Promise<UUID> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM drill_results WHERE session_id = ? AND drill_id = ?`,
    sessionId, drillId
  );
  if (existing) return existing.id;
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO drill_results (id, session_id, drill_id) VALUES (?, ?, ?)`,
    id, sessionId, drillId
  );
  await appendToQueue('INSERT', 'drill_results', { id, session_id: sessionId, drill_id: drillId });
  return id;
}

/**
 * Upserts an element value for a drill result. Inserts if no row exists for
 * this drillResultId+trackingElementId pair, otherwise updates the value.
 */
export async function upsertElementValue(
  drillResultId: UUID,
  trackingElementId: UUID,
  value: Record<string, unknown>
): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM element_values WHERE drill_result_id = ? AND tracking_element_id = ?`,
    drillResultId, trackingElementId
  );
  const json = JSON.stringify(value);
  if (existing) {
    await db.runAsync(`UPDATE element_values SET value = ? WHERE id = ?`, json, existing.id);
    await appendToQueue('UPDATE', 'element_values', { id: existing.id, value: json });
  } else {
    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO element_values (id, drill_result_id, tracking_element_id, value) VALUES (?, ?, ?, ?)`,
      id, drillResultId, trackingElementId, json
    );
    await appendToQueue('INSERT', 'element_values', {
      id, drill_result_id: drillResultId, tracking_element_id: trackingElementId, value: json,
    });
  }
}

/**
 * Returns drill results for a session, including the drill name from the drills table.
 */
export async function getDrillResultsWithDrillNames(sessionId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    drill_id: string;
    is_complete: number;
    drill_name: string;
  }>(
    `SELECT dr.id, dr.drill_id, dr.is_complete, d.name as drill_name
     FROM drill_results dr
     JOIN drills d ON d.id = dr.drill_id
     WHERE dr.session_id = ?`,
    sessionId
  );
}

/**
 * Updates the photo URL on a drill result row.
 */
export async function updateDrillResultPhoto(id: UUID, photoUrl: string | null) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE drill_results SET photo_url = ? WHERE id = ?`, photoUrl, id);
  await appendToQueue('UPDATE', 'drill_results', { id, photo_url: photoUrl });
}

export async function insertDrillResult(id: UUID, sessionId: UUID, drillId: UUID) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO drill_results (id, session_id, drill_id) VALUES (?, ?, ?)`,
    id, sessionId, drillId
  );
  await appendToQueue('INSERT', 'drill_results', { id, session_id: sessionId, drill_id: drillId });
}

export async function markDrillComplete(id: UUID) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE drill_results SET is_complete = 1 WHERE id = ?`, id);
  await appendToQueue('UPDATE', 'drill_results', { id, is_complete: true });
}

export async function updateDrillResultNote(id: UUID, note: string) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE drill_results SET note = ? WHERE id = ?`, note, id);
}

export async function getDrillResultsBySession(sessionId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    session_id: string;
    drill_id: string;
    is_complete: number;
    note: string | null;
    photo_url: string | null;
  }>(`SELECT * FROM drill_results WHERE session_id = ?`, sessionId);
}

export async function insertElementValue(id: UUID, drillResultId: UUID, trackingElementId: UUID, value: Record<string, unknown>) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO element_values (id, drill_result_id, tracking_element_id, value) VALUES (?, ?, ?, ?)`,
    id, drillResultId, trackingElementId, JSON.stringify(value)
  );
  await appendToQueue('INSERT', 'element_values', { id, drill_result_id: drillResultId, tracking_element_id: trackingElementId, value: JSON.stringify(value) });
}

export async function updateElementValue(id: UUID, value: Record<string, unknown>) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE element_values SET value = ? WHERE id = ?`,
    JSON.stringify(value), id
  );
}

export async function getElementValuesByDrillResult(drillResultId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    drill_result_id: string;
    tracking_element_id: string;
    value: string;
  }>(`SELECT * FROM element_values WHERE drill_result_id = ?`, drillResultId);
}

export async function getCompletedDrillCount(childId: UUID): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM drill_results dr
     JOIN sessions s ON s.id = dr.session_id
     WHERE s.child_id = ? AND dr.is_complete = 1`, childId
  );
  return result?.count ?? 0;
}
