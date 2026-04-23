import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { createMMKV } from 'react-native-mmkv';

import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import { useActiveSessionStore } from '@/stores/active-session.store';

const timerStorage = createMMKV({ id: 'session-timer' });

export function useStartSessionMutation() {
  return useMutation({
    mutationFn: async ({
      childId,
      activityId,
      activityName,
    }: {
      childId: string;
      activityId: string;
      activityName: string;
    }) => {
      const sessionId = randomUUID();
      const startedAt = new Date().toISOString();

      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO sessions (id, child_id, activity_id, started_at) VALUES (?, ?, ?, ?)`,
        sessionId,
        childId,
        activityId,
        startedAt
      );
      await appendToQueue('INSERT', 'sessions', {
        id: sessionId,
        child_id: childId,
        activity_id: activityId,
        started_at: startedAt,
      });

      // Start session timer (written to MMKV so it survives app kill)
      timerStorage.set('timer_startTime', Date.now());
      timerStorage.remove('timer_pausedAt');
      timerStorage.set('timer_totalPausedMs', 0);

      useActiveSessionStore.getState().startSession(sessionId, activityId, activityName);

      return { sessionId, startedAt };
    },
  });
}
