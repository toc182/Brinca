import { useQuery } from '@tanstack/react-query';

import { getDatabase } from '@/lib/sqlite/db';

interface ActivityItem {
  id: string;
  name: string;
  icon: string | null;
}

async function getActiveActivitiesForChild(childId: string): Promise<ActivityItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityItem>(
    `SELECT id, name, icon FROM activities WHERE child_id = ? AND is_active = 1 ORDER BY display_order ASC`,
    childId
  );
}

export function useActivitiesQuery(childId: string | null) {
  return useQuery({
    queryKey: ['activities-selector', childId ?? ''],
    queryFn: () => getActiveActivitiesForChild(childId!),
    enabled: !!childId,
  });
}
