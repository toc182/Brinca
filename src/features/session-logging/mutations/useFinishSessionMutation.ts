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
      await finishSession(sessionId, endedAt, elapsedSeconds);
      const tierResults = await evaluateTiers(sessionId, childId);
      const newAccolades = await evaluateAccolades(childId);
      return { tierResults, newAccolades, durationSeconds: elapsedSeconds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
