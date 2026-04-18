import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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
  }))
);
