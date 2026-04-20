import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function getDashboardData(childId: UUID) {
  const db = await getDatabase();

  const balance = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM currency_ledger WHERE child_id = ?`, childId
  );

  const totalSessions = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions WHERE child_id = ? AND is_complete = 1`, childId
  );

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const sessionsThisWeek = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions WHERE child_id = ? AND is_complete = 1 AND started_at >= ?`,
    childId, startOfWeek.toISOString()
  );

  const sessionDates = await db.getAllAsync<{ started_at: string }>(
    `SELECT started_at FROM sessions WHERE child_id = ? AND is_complete = 1 ORDER BY started_at DESC`, childId
  );

  const recentSessions = await db.getAllAsync<{
    id: string; activity_id: string; started_at: string; duration_seconds: number | null;
  }>(
    `SELECT s.id, s.activity_id, s.started_at, s.duration_seconds FROM sessions s
     WHERE s.child_id = ? AND s.is_complete = 1 ORDER BY s.started_at DESC LIMIT 2`, childId
  );

  // Enrich recent sessions with activity names
  const enriched = [];
  for (const s of recentSessions) {
    const activity = await db.getFirstAsync<{ name: string }>(`SELECT name FROM activities WHERE id = ?`, s.activity_id);
    enriched.push({ ...s, activityName: activity?.name ?? 'Unknown' });
  }

  const accolades = await db.getAllAsync<{ accolade_id: string; unlocked_at: string }>(
    `SELECT accolade_id, unlocked_at FROM accolade_unlocks WHERE child_id = ? ORDER BY unlocked_at DESC LIMIT 3`, childId
  );

  const closestReward = await db.getFirstAsync<{ id: string; name: string; cost: number; state: string }>(
    `SELECT * FROM rewards WHERE child_id = ? AND state = 'saving' ORDER BY cost ASC LIMIT 1`, childId
  );

  return {
    balance: balance?.total ?? 0,
    totalSessions: totalSessions?.count ?? 0,
    sessionsThisWeek: sessionsThisWeek?.count ?? 0,
    sessionDates: sessionDates.map((r) => r.started_at),
    recentSessions: enriched,
    accolades,
    closestReward,
  };
}
