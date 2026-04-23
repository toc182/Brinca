import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'active-session' });
const timerStorage = createMMKV({ id: 'session-timer' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

type SessionStatus = 'idle' | 'active' | 'minimized' | 'paused' | 'complete';

interface ActiveSessionState {
  status: SessionStatus;
  sessionId: string | null;
  activityId: string | null;
  activityName: string | null;
  startSession: (sessionId: string, activityId: string, activityName: string) => void;
  setStatus: (status: SessionStatus) => void;
  clearSession: () => void;
}

export const useActiveSessionStore = create<ActiveSessionState>()(
  persist(
    immer((set) => ({
      status: 'idle',
      sessionId: null,
      activityId: null,
      activityName: null,
      startSession: (sessionId, activityId, activityName) =>
        set((state) => {
          state.status = 'active';
          state.sessionId = sessionId;
          state.activityId = activityId;
          state.activityName = activityName;
        }),
      setStatus: (status) =>
        set((state) => {
          state.status = status;
        }),
      clearSession: () =>
        set((state) => {
          state.status = 'idle';
          state.sessionId = null;
          state.activityId = null;
          state.activityName = null;
        }),
    })),
    {
      name: 'active-session-storage',
      version: 1,
      migrate: (persisted) => persisted as Record<string, unknown>,
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        // Self-heal: if status is not idle but sessionId is missing, reset.
        // Mutate state directly — calling actions during rehydration is a race condition.
        if (state && state.status !== 'idle' && !state.sessionId) {
          state.status = 'idle';
          state.sessionId = null;
          state.activityId = null;
          state.activityName = null;
          // Also clear orphaned timer MMKV keys
          timerStorage.remove('timer_startTime');
          timerStorage.remove('timer_pausedAt');
          timerStorage.remove('timer_totalPausedMs');
        }
      },
    }
  )
);
