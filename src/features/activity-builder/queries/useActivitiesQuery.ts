import { useQuery } from '@tanstack/react-query';

import { getActivitiesByChild } from '../repositories/activity.repository';
import { activityBuilderKeys } from './keys';

export function useActivitiesQuery(childId: string | null) {
  return useQuery({
    queryKey: activityBuilderKeys.activities(childId ?? ''),
    queryFn: () => getActivitiesByChild(childId!),
    enabled: !!childId,
  });
}
