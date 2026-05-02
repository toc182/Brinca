import { useQuery } from '@tanstack/react-query';

import { getTierRewards } from '../repositories/tier-reward.repository';
import { activityBuilderKeys } from './keys';

export function useTierRewardsQuery(parentType: 'activity' | 'drill', parentId: string) {
  return useQuery({
    queryKey: activityBuilderKeys.tierRewards(parentType, parentId),
    queryFn: () => getTierRewards(parentType, parentId),
    enabled: !!parentId,
  });
}
