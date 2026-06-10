import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import { formatTimerWithCentiseconds } from '@/shared/utils/formatTimer';
import type { StopwatchConfig } from '@/shared/tracking-elements/types/element-configs';
import type { StopwatchValue } from '@/shared/tracking-elements/types/element-values';

const elementTimerStorage = createMMKV({ id: 'element-timers' });

// If the parent doesn't return to the app within this window, we stop the
// timer at its last-saved value instead of letting it count up indefinitely.
const STALE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

// Centisecond display requires a sub-100ms tick so the trailing two digits
// animate smoothly rather than chunking by 10.
const TICK_INTERVAL_MS = 33;

interface StopwatchElementProps {
  value: StopwatchValue;
  onValueChange: (value: StopwatchValue) => void;
  config: StopwatchConfig;
  elementId?: string;
}

export function StopwatchElement({ value, onValueChange, config, elementId }: StopwatchElementProps) {
  const mmkvKey = elementId ? `sw_start_${elementId}` : null;
  const baseKey = elementId ? `sw_base_${elementId}` : null;

  // If startTime was persisted, the timer was running when the app was killed.
  // Auto-resume — unless more than STALE_TIMEOUT_MS has passed, in which case
  // we treat it as paused at the last-saved value to avoid a runaway clock.
  const persistedStart = mmkvKey ? elementTimerStorage.getNumber(mmkvKey) : null;
  const persistedBase = baseKey ? elementTimerStorage.getNumber(baseKey) : null;
  const isStaleStart =
    persistedStart != null && Date.now() - persistedStart > STALE_TIMEOUT_MS;

  const [isRunning, setIsRunning] = useState(persistedStart != null && !isStaleStart);
  const startTimeRef = useRef<number | null>(isStaleStart ? null : persistedStart ?? null);
  const baseElapsedRef = useRef(
    isStaleStart ? value.elapsed_seconds : persistedBase ?? value.elapsed_seconds,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasTarget = config.targetSeconds != null;
  const isAtTarget = hasTarget && value.elapsed_seconds >= config.targetSeconds!;

  useEffect(() => {
    if (isStaleStart) {
      // Clean up the stale persisted state so the next start is fresh.
      if (mmkvKey) elementTimerStorage.remove(mmkvKey);
      if (baseKey) elementTimerStorage.remove(baseKey);
      return;
    }
    if (persistedStart != null) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current != null) {
          const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
          onValueChange({ elapsed_seconds: elapsed });
        }
      }, TICK_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    const now = Date.now();
    startTimeRef.current = now;
    baseElapsedRef.current = value.elapsed_seconds;
    if (mmkvKey) elementTimerStorage.set(mmkvKey, now);
    if (baseKey) elementTimerStorage.set(baseKey, value.elapsed_seconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current != null) {
        const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
        onValueChange({ elapsed_seconds: elapsed });
      }
    }, TICK_INTERVAL_MS);
  };

  const pause = () => {
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mmkvKey) elementTimerStorage.remove(mmkvKey);
    if (baseKey) elementTimerStorage.remove(baseKey);
    if (startTimeRef.current != null) {
      const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
      baseElapsedRef.current = elapsed;
      onValueChange({ elapsed_seconds: elapsed });
      startTimeRef.current = null;
    }
  };

  const reset = () => {
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mmkvKey) elementTimerStorage.remove(mmkvKey);
    if (baseKey) elementTimerStorage.remove(baseKey);
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    onValueChange({ elapsed_seconds: 0 });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.time, isAtTarget && styles.timeAtTarget]}>
        {formatTimerWithCentiseconds(value.elapsed_seconds)}
      </Text>

      {hasTarget && (
        <Text style={styles.target}>Target: {formatTimerWithCentiseconds(config.targetSeconds!)}</Text>
      )}

      <View style={styles.buttonRow}>
        {!isRunning ? (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>
              {value.elapsed_seconds > 0 ? 'Resume' : 'Start'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={pause}
            style={({ pressed }) => [styles.warningButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.warningButtonText}>Pause</Text>
          </Pressable>
        )}

        {value.elapsed_seconds > 0 && !isRunning && (
          <Pressable
            onPress={reset}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  time: {
    ...typography.timer,
    color: colors.textPrimary,
  },
  timeAtTarget: {
    color: colors.success500,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.buttonLarge,
    color: colors.textOnPrimary,
  },
  warningButton: {
    backgroundColor: colors.warning500,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  warningButtonText: {
    ...typography.buttonLarge,
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.buttonLarge,
    color: colors.primary700,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
