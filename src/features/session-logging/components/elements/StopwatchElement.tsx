import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { StopwatchConfig } from '@/shared/tracking-elements/types/element-configs';
import type { StopwatchValue } from '@/shared/tracking-elements/types/element-values';

const elementTimerStorage = createMMKV({ id: 'element-timers' });

interface StopwatchElementProps {
  value: StopwatchValue;
  onValueChange: (value: StopwatchValue) => void;
  config: StopwatchConfig;
  elementId?: string;
}

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function StopwatchElement({ value, onValueChange, config, elementId }: StopwatchElementProps) {
  const [isRunning, setIsRunning] = useState(false);
  const mmkvKey = elementId ? `sw_start_${elementId}` : null;

  // Restore persisted startTime on mount (survives app kill if timer was running)
  const persistedStart = mmkvKey ? elementTimerStorage.getNumber(mmkvKey) : null;
  const startTimeRef = useRef<number | null>(persistedStart ?? null);
  const baseElapsedRef = useRef(
    persistedStart != null
      ? value.elapsed_seconds + (Date.now() - persistedStart) / 1000
      : value.elapsed_seconds
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasTarget = config.targetSeconds != null;
  const isAtTarget = hasTarget && value.elapsed_seconds >= config.targetSeconds!;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const start = () => {
    const now = Date.now();
    startTimeRef.current = now;
    baseElapsedRef.current = value.elapsed_seconds;
    if (mmkvKey) elementTimerStorage.set(mmkvKey, now);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current != null) {
        const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
        onValueChange({ elapsed_seconds: elapsed });
      }
    }, 100);
  };

  const pause = () => {
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mmkvKey) elementTimerStorage.remove(mmkvKey);
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
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    onValueChange({ elapsed_seconds: 0 });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.time, isAtTarget && styles.timeAtTarget]}>
        {formatTime(value.elapsed_seconds)}
      </Text>

      {hasTarget && (
        <Text style={styles.target}>Target: {formatTime(config.targetSeconds!)}</Text>
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
