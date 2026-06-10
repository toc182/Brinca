import { useQuery } from '@tanstack/react-query';

import { getActivitiesWithRecency, type ActivityWithRecency } from '../repositories/activity.repository';

export type { ActivityWithRecency };

export function useActivitiesQuery(childId: string | null) {
  return useQuery({
    queryKey: ['activities-selector', childId ?? ''],
    queryFn: () => getActivitiesWithRecency(childId!),
    enabled: !!childId,
  });
}
