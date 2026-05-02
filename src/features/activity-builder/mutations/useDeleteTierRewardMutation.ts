import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteTierReward } from '../repositories/tier-reward.repository';
import { activityBuilderKeys } from '../queries/keys';

interface DeleteTierRewardInput {
  id: string;
  parentType: 'activity' | 'drill';
  parentId: string;
}

export function useDeleteTierRewardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteTierRewardInput) => deleteTierReward(id),
    onSuccess: (_data, { parentType, parentId }) => {
      queryClient.invalidateQueries({
        queryKey: activityBuilderKeys.tierRewards(parentType, parentId),
      });
    },
  });
}
