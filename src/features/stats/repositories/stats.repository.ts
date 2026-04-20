import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function getStatsSummary(childId: UUID) {
  const db = await getDatabase();

  const sessions = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions WHERE child_id = ? AND is_complete = 1`, childId
  );

  const drills = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM drill_results dr
     JOIN sessions s ON s.id = dr.session_id
     WHERE s.child_id = ? AND dr.is_complete = 1`, childId
  );

  const duration = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions WHERE child_id = ? AND is_complete = 1`, childId
  );

  const currency = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM currency_ledger WHERE child_id = ? AND amount > 0`, childId
  );

  return {
    sessionsCount: sessions?.count ?? 0,
    drillsCount: drills?.count ?? 0,
    totalDurationSeconds: duration?.total ?? 0,
    currencyEarned: currency?.total ?? 0,
  };
}

export async function getSessionList(childId: UUID) {
  const db = await getDatabase();
  const sessions = await db.getAllAsync<{
    id: string; activity_id: string; started_at: string; duration_seconds: number | null; is_complete: number;
  }>(
    `SELECT * FROM sessions WHERE child_id = ? ORDER BY started_at DESC`, childId
  );

  const enriched = [];
  for (const s of sessions) {
    const activity = await db.getFirstAsync<{ name: string }>(`SELECT name FROM activities WHERE id = ?`, s.activity_id);
    enriched.push({ ...s, activityName: activity?.name ?? 'Unknown' });
  }
  return enriched;
}

export async function getSessionDetail(sessionId: UUID) {
  const db = await getDatabase();

  const session = await db.getFirstAsync<{
    id: string; activity_id: string; started_at: string; ended_at: string | null;
    duration_seconds: number | null; note: string | null; is_complete: number;
  }>(`SELECT * FROM sessions WHERE id = ?`, sessionId);

  const activity = session
    ? await db.getFirstAsync<{ name: string }>(`SELECT name FROM activities WHERE id = ?`, session.activity_id)
    : null;

  const drillResults = await db.getAllAsync<{
    id: string; drill_id: string; is_complete: number; note: string | null;
  }>(`SELECT * FROM drill_results WHERE session_id = ?`, sessionId);

  const enrichedDrills = [];
  for (const dr of drillResults) {
    const drill = await db.getFirstAsync<{ name: string }>(`SELECT name FROM drills WHERE id = ?`, dr.drill_id);
    enrichedDrills.push({ ...dr, drillName: drill?.name ?? 'Unknown' });
  }

  return {
    session,
    activityName: activity?.name ?? 'Unknown',
    drillResults: enrichedDrills,
  };
}

export async function deleteSession(sessionId: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sessions WHERE id = ?`, sessionId);
}
