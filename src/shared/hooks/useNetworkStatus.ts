import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkStatus {
  isOnline: boolean;
}

/**
 * Returns the current network connectivity status.
 * Updates automatically when connectivity changes.
 * Defaults to online until first NetInfo event arrives.
 *
 * When NetInfo reports offline, verifies with a real HTTP request
 * because NetInfo can give false negatives on iOS 26+.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected !== false) {
        setIsOnline(true);
        return;
      }

      // NetInfo says offline — verify with a real request before showing banner
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
      verifyTimer.current = setTimeout(async () => {
        try {
          const res = await fetch('https://clients3.google.com/generate_204', {
            method: 'HEAD',
            cache: 'no-store',
          });
          setIsOnline(res.status === 204);
        } catch {
          setIsOnline(false);
        }
      }, 500);
    });

    return () => {
      unsubscribe();
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
    };
  }, []);

  return { isOnline };
}
