import { useActiveSessionStore } from '@/stores/active-session.store';

/**
 * MiniPlayerBar — persistent bar above the tab bar during an active session.
 * Stub: invisible until Phase 6 wires up real session state.
 */
export function MiniPlayerBar() {
  const status = useActiveSessionStore((s) => s.status);

  // Only render when a session is active/minimized/paused
  if (status === 'idle' || status === 'complete') {
    return null;
  }

  // Phase 6 will implement the visible bar with activity name + Resume button.
  return null;
}
