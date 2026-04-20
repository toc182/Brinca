import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { insertReward } from '../repositories/reward.repository';
import { homeKeys } from '../queries/keys';

export function useCreateRewardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, name, cost }: { childId: string; name: string; cost: number }) => {
      const id = randomUUID();
      await insertReward(id, childId, name, cost);
      return { id };
    },
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({ queryKey: homeKeys.dashboard(childId) });
    },
  });
}
