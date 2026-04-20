import { useQuery } from '@tanstack/react-query';

import { getDrillsByActivity } from '../repositories/drill.repository';
import { activityBuilderKeys } from './keys';

export function useDrillsQuery(activityId: string) {
  return useQuery({
    queryKey: activityBuilderKeys.drills(activityId),
    queryFn: () => getDrillsByActivity(activityId),
  });
}
