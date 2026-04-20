import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { appendLedgerEntry } from '../repositories/currency-ledger.repository';

export function useAddBonusMutation() {
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
  });
}
