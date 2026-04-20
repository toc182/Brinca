import { useActiveSessionStore } from '@/stores/active-session.store';

export function useActiveSession() {
  const status = useActiveSessionStore((s) => s.status);
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const activityId = useActiveSessionStore((s) => s.activityId);
  const activityName = useActiveSessionStore((s) => s.activityName);

  return {
    status,
    sessionId,
    activityId,
    activityName,
    isActive: status !== 'idle' && status !== 'complete',
    isIdle: status === 'idle',
  };
}
