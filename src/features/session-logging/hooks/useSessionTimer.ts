import { useEffect, useState, useCallback, useRef } from 'react';
import { createMMKV, useMMKVNumber } from 'react-native-mmkv';

const timerStorage = createMMKV({ id: 'session-timer' });

const KEYS = {
  startTime: 'timer_startTime',
  pausedAt: 'timer_pausedAt',
  totalPausedMs: 'timer_totalPausedMs',
};

export function useSessionTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Subscribe to pausedAt across hook instances — when one consumer pauses,
  // all others (header timer pill, footer button, screen overlay) re-render.
  const [pausedAt] = useMMKVNumber(KEYS.pausedAt, timerStorage);
  const isPaused = !!pausedAt;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculateElapsed = useCallback(() => {
    const startTime = timerStorage.getNumber(KEYS.startTime);
    if (!startTime) return 0;

    const pausedAtVal = timerStorage.getNumber(KEYS.pausedAt);
    const totalPausedMs = timerStorage.getNumber(KEYS.totalPausedMs) ?? 0;

    const now = pausedAtVal ?? Date.now();
    return Math.floor((now - startTime - totalPausedMs) / 1000);
  }, []);

  useEffect(() => {
    setElapsedSeconds(calculateElapsed());

    intervalRef.current = setInterval(() => {
      if (!timerStorage.getNumber(KEYS.pausedAt)) {
        setElapsedSeconds(calculateElapsed());
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calculateElapsed]);

  // Recompute elapsed when paused state flips, so the display freezes/unfreezes
  // immediately instead of waiting for the next 1s tick.
  useEffect(() => {
    setElapsedSeconds(calculateElapsed());
  }, [isPaused, calculateElapsed]);

  const start = useCallback(() => {
    timerStorage.set(KEYS.startTime, Date.now());
    timerStorage.remove(KEYS.pausedAt);
    timerStorage.set(KEYS.totalPausedMs, 0);
    setElapsedSeconds(0);
  }, []);

  const pause = useCallback(() => {
    if (!timerStorage.getNumber(KEYS.pausedAt)) {
      timerStorage.set(KEYS.pausedAt, Date.now());
    }
  }, []);

  const resume = useCallback(() => {
    const p = timerStorage.getNumber(KEYS.pausedAt);
    if (p) {
      const totalPausedMs = timerStorage.getNumber(KEYS.totalPausedMs) ?? 0;
      timerStorage.set(KEYS.totalPausedMs, totalPausedMs + (Date.now() - p));
      timerStorage.remove(KEYS.pausedAt);
    }
  }, []);

  const reset = useCallback(() => {
    timerStorage.remove(KEYS.startTime);
    timerStorage.remove(KEYS.pausedAt);
    timerStorage.remove(KEYS.totalPausedMs);
    setElapsedSeconds(0);
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
