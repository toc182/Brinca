import { useActiveSessionStore } from '@/stores/active-session.store';

export function useActiveSession() {
  const status = useActiveSessionStore((s) => s.status);
  return {
    isActive: status !== 'idle' && status !== 'complete',
  };
}
