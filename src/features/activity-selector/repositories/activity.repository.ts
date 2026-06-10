import { getDatabase } from '@/lib/sqlite/db';

export interface ActivityWithRecency {
  id: string;
  name: string;
  icon: string | null;
  last_session_at: string | null;
}

export async function getActivitiesWithRecency(childId: string): Promise<ActivityWithRecency[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityWithRecency>(
    `SELECT a.id, a.name, a.icon,
            s.last_date AS last_session_at
       FROM activities a
       LEFT JOIN (
         SELECT activity_id, MAX(started_at) AS last_date
         FROM sessions
         WHERE child_id = ? AND is_complete = 1
         GROUP BY activity_id
       ) s ON s.activity_id = a.id
      WHERE a.child_id = ? AND a.is_active = 1
      ORDER BY a.display_order ASC`,
    childId,
    childId,
  );
}
