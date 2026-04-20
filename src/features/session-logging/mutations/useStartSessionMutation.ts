import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useActiveSessionStore } from '@/stores/active-session.store';
import { insertSession } from '../repositories/session.repository';

export function useStartSessionMutation() {
  return useMutation({
    mutationFn: async ({ childId, activityId, activityName }: {
      childId: string;
      activityId: string;
      activityName: string;
    }) => {
      const sessionId = randomUUID();
      const startedAt = new Date().toISOString();

      await insertSession(sessionId, childId, activityId, startedAt);

      useActiveSessionStore.getState().startSession(sessionId, activityId, activityName);

      return { sessionId, startedAt };
    },
  });
}
