import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function getDashboardData(childId: UUID) {
  const db = await getDatabase();

  const child = await db.getFirstAsync<{ name: string; avatar_url: string | null }>(
    `SELECT name, avatar_url FROM children WHERE id = ?`, childId
  );

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

  // Per-session rows for the activity calendar: each completed session with its
  // activity and how many drills were completed in it. The calendar groups these
  // by day and by activity to draw the per-day rings and the day-detail drawer.
  const calendarSessions = await db.getAllAsync<{
    started_at: string; activity_id: string; activity_name: string; drill_count: number;
  }>(
    `SELECT s.started_at, s.activity_id, a.name AS activity_name,
            (SELECT COUNT(*) FROM drill_results dr WHERE dr.session_id = s.id AND dr.is_complete = 1) AS drill_count
     FROM sessions s
     JOIN activities a ON a.id = s.activity_id
     WHERE s.child_id = ? AND s.is_complete = 1
     ORDER BY s.started_at DESC`,
    childId
  );

  const recentSessions = await db.getAllAsync<{
    id: string; activity_id: string; started_at: string;
    duration_seconds: number | null; is_complete: number;
  }>(
    `SELECT s.id, s.activity_id, s.started_at, s.duration_seconds, s.is_complete
     FROM sessions s
     WHERE s.child_id = ? ORDER BY s.started_at DESC LIMIT 2`, childId
  );

  // Enrich recent sessions with activity names
  const enriched = [];
  for (const s of recentSessions) {
    const activity = await db.getFirstAsync<{ name: string }>(`SELECT name FROM activities WHERE id = ?`, s.activity_id);
    enriched.push({ ...s, activityName: activity?.name ?? 'Unknown', isComplete: s.is_complete === 1 });
  }

  const accolades = await db.getAllAsync<{ accolade_id: string; unlocked_at: string }>(
    `SELECT accolade_id, unlocked_at FROM accolade_unlocks WHERE child_id = ? ORDER BY unlocked_at DESC LIMIT 3`, childId
  );

  const closestReward = await db.getFirstAsync<{ id: string; name: string; cost: number; state: string }>(
    `SELECT * FROM rewards WHERE child_id = ? AND state = 'saving' ORDER BY cost ASC LIMIT 1`, childId
  );

  const hasAnySession = (totalSessions?.count ?? 0) > 0;

  // Whether the child has any practice set up at all (a live drill under a live
  // activity). Distinguishes "no sessions yet, go practice" from the true
  // brand-new "add your first drill" state.
  const drillCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM drills d
       JOIN activities a ON a.id = d.activity_id
      WHERE a.child_id = ? AND d.deleted_at IS NULL AND a.deleted_at IS NULL`,
    childId
  );
  const hasDrills = (drillCount?.count ?? 0) > 0;

  return {
    childPhotoUrl: child?.avatar_url ?? null,
    balance: balance?.total ?? 0,
    totalSessions: totalSessions?.count ?? 0,
    sessionsThisWeek: sessionsThisWeek?.count ?? 0,
    calendarSessions,
    recentSessions: enriched,
    accolades,
    closestReward,
    hasAnySession,
    hasDrills,
  };
}
