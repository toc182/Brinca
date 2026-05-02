import { useQuery } from '@tanstack/react-query';

import { getBonusPresets } from '../repositories/bonus-preset.repository';
import { activityBuilderKeys } from './keys';

export function useBonusPresetsQuery(parentType: 'activity' | 'drill', parentId: string) {
  return useQuery({
    queryKey: activityBuilderKeys.bonusPresets(parentType, parentId),
    queryFn: () => getBonusPresets(parentType, parentId),
    enabled: !!parentId,
  });
}
