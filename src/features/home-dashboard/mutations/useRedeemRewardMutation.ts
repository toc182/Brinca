import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { updateRewardState } from '../repositories/reward.repository';
import { appendLedgerEntry } from '@/features/session-logging/repositories/currency-ledger.repository';
import { insertAccoladeUnlock, isAccoladeUnlocked } from '@/features/session-logging/repositories/accolade.repository';
import { homeKeys } from '../queries/keys';

export function useRedeemRewardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rewardId, childId, cost }: { rewardId: string; childId: string; cost: number }) => {
      // Deduct from balance
      const ledgerId = randomUUID();
      await appendLedgerEntry(ledgerId, childId, -cost, 'reward_redemption', rewardId, 'Reward redeemed');

      // Mark as redeemed
      await updateRewardState(rewardId, 'redeemed', new Date().toISOString());

      // Check "Big Win" accolade (first-ever redemption)
      const alreadyUnlocked = await isAccoladeUnlocked(childId, 'big_win');
      if (!alreadyUnlocked) {
        await insertAccoladeUnlock(childId, 'big_win');
      }
    },
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({ queryKey: homeKeys.dashboard(childId) });
    },
  });
}
