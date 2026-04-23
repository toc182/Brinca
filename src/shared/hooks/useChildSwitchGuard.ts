import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';

/**
 * Wraps setActiveChild with a session guard.
 * If a session is active, shows a native alert and blocks the switch.
 * Per spec: "You have a session in progress. Finish it before switching children."
 */
export function useChildSwitchGuard() {
  const setActiveChild = useActiveChildStore((s) => s.setActiveChild);

  const trySetActiveChild = useCallback(
    (childId: string, childName: string, familyId: string) => {
      const { status } = useActiveSessionStore.getState();
      if (status !== 'idle' && status !== 'complete') {
        Alert.alert(
          'Session in progress',
          'You have a session in progress. Finish it before switching children.',
          [{ text: 'OK' }]
        );
        return;
      }
      setActiveChild(childId, childName, familyId);
    },
    [setActiveChild]
  );

  return { trySetActiveChild };
}
