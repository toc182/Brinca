import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useActiveSessionStore } from '@/stores/active-session.store';
import { finishSession } from '../repositories/session.repository';
import { evaluateTiers } from '../utils/tier-evaluator';
import { evaluateAccolades } from '../utils/accolade-evaluator';

export function useFinishSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, childId, elapsedSeconds }: {
      sessionId: string;
      childId: string;
      elapsedSeconds: number;
    }) => {
      const endedAt = new Date().toISOString();

      // 1. Mark session complete
      await finishSession(sessionId, endedAt, elapsedSeconds);

      // 2. Evaluate tier rewards and create ledger entries
      const tierResults = await evaluateTiers(sessionId, childId);

      // 3. Evaluate accolades
      const newAccolades = await evaluateAccolades(childId);

      // 4. Clear active session
      useActiveSessionStore.getState().clearSession();

      // 5. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      return { tierResults, newAccolades, durationSeconds: elapsedSeconds };
    },
  });
}
