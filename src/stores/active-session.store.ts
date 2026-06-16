import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'active-session' });
const timerStorage = createMMKV({ id: 'session-timer' });
// Per-element timer state (stopwatch/countdown/lap/interval start times), keyed
// only by element id. Cleared when a session ends so a timer left running can't
// auto-resume in the next session — see clearSession.
const elementTimerStorage = createMMKV({ id: 'element-timers' });

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
      clearSession: () => {
        // Stop every element timer when the session ends (finish or abandon).
        // Timer start times are keyed by element id and reused across sessions,
        // so without this a running stopwatch resumes in the next session.
        elementTimerStorage.clearAll();
        set((state) => {
          state.status = 'idle';
          state.sessionId = null;
          state.activityId = null;
          state.activityName = null;
        });
      },
    })),
    {
      name: 'active-session-storage',
      version: 1,
      migrate: (persisted: unknown, _version: number): ActiveSessionState => {
        // Currently at version 1 — no migrations needed yet.
        // When bumping the version above, add explicit per-version translation
        // here (e.g., if (version === 1) { /* rename or default new fields */ }).
        return persisted as ActiveSessionState;
      },
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
