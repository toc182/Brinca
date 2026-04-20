import { useEffect, useState, useCallback, useRef } from 'react';
import { createMMKV } from 'react-native-mmkv';

const timerStorage = createMMKV({ id: 'session-timer' });

const KEYS = {
  startTime: 'timer_startTime',
  pausedAt: 'timer_pausedAt',
  totalPausedMs: 'timer_totalPausedMs',
};

export function useSessionTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculateElapsed = useCallback(() => {
    const startTime = timerStorage.getNumber(KEYS.startTime);
    if (!startTime) return 0;

    const pausedAt = timerStorage.getNumber(KEYS.pausedAt);
    const totalPausedMs = timerStorage.getNumber(KEYS.totalPausedMs) ?? 0;

    const now = pausedAt ?? Date.now();
    return Math.floor((now - startTime - totalPausedMs) / 1000);
  }, []);

  useEffect(() => {
    // Initial calculation
    setElapsedSeconds(calculateElapsed());
    setIsPaused(!!timerStorage.getNumber(KEYS.pausedAt));

    intervalRef.current = setInterval(() => {
      if (!timerStorage.getNumber(KEYS.pausedAt)) {
        setElapsedSeconds(calculateElapsed());
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calculateElapsed]);

  const start = useCallback(() => {
    timerStorage.set(KEYS.startTime, Date.now());
    timerStorage.remove(KEYS.pausedAt);
    timerStorage.set(KEYS.totalPausedMs, 0);
    setIsPaused(false);
    setElapsedSeconds(0);
  }, []);

  const pause = useCallback(() => {
    if (!timerStorage.getNumber(KEYS.pausedAt)) {
      timerStorage.set(KEYS.pausedAt, Date.now());
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    const pausedAt = timerStorage.getNumber(KEYS.pausedAt);
    if (pausedAt) {
      const totalPausedMs = timerStorage.getNumber(KEYS.totalPausedMs) ?? 0;
      timerStorage.set(KEYS.totalPausedMs, totalPausedMs + (Date.now() - pausedAt));
      timerStorage.remove(KEYS.pausedAt);
      setIsPaused(false);
    }
  }, []);

  const reset = useCallback(() => {
    timerStorage.remove(KEYS.startTime);
    timerStorage.remove(KEYS.pausedAt);
    timerStorage.remove(KEYS.totalPausedMs);
    setElapsedSeconds(0);
    setIsPaused(false);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    elapsedSeconds,
    isPaused,
    formatted: formatTime(elapsedSeconds),
    start,
    pause,
    resume,
    reset,
    isActive: !!timerStorage.getNumber(KEYS.startTime),
  };
}
