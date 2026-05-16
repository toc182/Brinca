import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { homeKeys } from '@/features/home-dashboard/queries/keys';
import { appendLedgerEntry } from '../repositories/currency-ledger.repository';
import { sessionKeys } from '../queries/keys';

export function useAddBonusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, amount, reason, sessionId }: {
      childId: string;
      amount: number;
      reason: string;
      sessionId: string;
    }) => {
      const id = randomUUID();
      await appendLedgerEntry(id, childId, amount, 'manual_bonus', sessionId, reason);
      return { id };
    },
    onSuccess: (_, { childId, sessionId }) => {
      queryClient.invalidateQueries({ queryKey: homeKeys.dashboard(childId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessionBonuses(sessionId) });
    },
  });
}
