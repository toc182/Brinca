import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMMKV } from 'react-native-mmkv';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { CountdownTimerConfig } from '@/shared/tracking-elements/types/element-configs';
import type { CountdownTimerValue } from '@/shared/tracking-elements/types/element-values';

const elementTimerStorage = createMMKV({ id: 'element-timers' });

interface CountdownTimerElementProps {
  value: CountdownTimerValue;
  onValueChange: (value: CountdownTimerValue) => void;
  config: CountdownTimerConfig;
  elementId?: string;
}

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function CountdownTimerElement({ value, onValueChange, config, elementId }: CountdownTimerElementProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const mmkvKey = elementId ? `cd_start_${elementId}` : null;
  const persistedStart = mmkvKey ? elementTimerStorage.getNumber(mmkvKey) : null;
  const startTimeRef = useRef<number | null>(persistedStart ?? null);
  const baseElapsedRef = useRef(
    persistedStart != null
      ? value.elapsed_seconds + (Date.now() - persistedStart) / 1000
      : value.elapsed_seconds
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashAnim = useRef(new Animated.Value(1)).current;
  const flashLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isFinished = value.remaining_seconds <= 0;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      flashLoopRef.current?.stop();
    };
  }, []);

  // Flash animation for alert state
  useEffect(() => {
    if (isAlerting) {
      flashLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      );
      flashLoopRef.current.start();
    } else {
      flashLoopRef.current?.stop();
      flashAnim.setValue(1);
    }
  }, [isAlerting, flashAnim]);

  const stopTicking = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mmkvKey) elementTimerStorage.remove(mmkvKey);
    startTimeRef.current = null;
  }, [mmkvKey]);

  const tick = useCallback(() => {
    if (startTimeRef.current == null) return;
    const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
    const remaining = Math.max(0, config.durationSeconds - elapsed);
    onValueChange({ elapsed_seconds: elapsed, remaining_seconds: remaining });

    if (remaining <= 0) {
      stopTicking();
      // Haptic alert feedback (plays system sound equivalent)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setIsAlerting(true);
    }
  }, [config.durationSeconds, onValueChange, stopTicking]);

  const start = () => {
    if (isFinished) return;
    const now = Date.now();
    startTimeRef.current = now;
    baseElapsedRef.current = value.elapsed_seconds;
    if (mmkvKey) elementTimerStorage.set(mmkvKey, now);
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
  };

  const pause = () => {
    if (startTimeRef.current != null) {
      const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, config.durationSeconds - elapsed);
      baseElapsedRef.current = elapsed;
      onValueChange({ elapsed_seconds: elapsed, remaining_seconds: remaining });
    }
    stopTicking();
  };

  const reset = () => {
    stopTicking();
    setIsAlerting(false);
    baseElapsedRef.current = 0;
    onValueChange({ elapsed_seconds: 0, remaining_seconds: config.durationSeconds });
  };

  // Tap anywhere (when alerting) to silence
  const handleSilence = () => {
    setIsAlerting(false);
  };

  const progress = 1 - value.remaining_seconds / config.durationSeconds;

  return (
    <Pressable
      onPress={isAlerting ? handleSilence : undefined}
      style={styles.container}
    >
      <Animated.Text style={[styles.time, isFinished && styles.timeFinished, { opacity: isAlerting ? flashAnim : 1 }]}>
        {formatTime(value.remaining_seconds)}
      </Animated.Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>

      {isFinished && (
        <Text style={styles.finishedLabel}>
          {isAlerting ? "Time's up! Tap to dismiss." : "Time's up!"}
        </Text>
      )}

      {!isAlerting && (
        <View style={styles.buttonRow}>
          {!isRunning && !isFinished ? (
            <Pressable
              onPress={start}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>
                {value.elapsed_seconds > 0 ? 'Resume' : 'Start'}
              </Text>
            </Pressable>
          ) : isRunning ? (
            <Pressable
              onPress={pause}
              style={({ pressed }) => [styles.warningButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.warningButtonText}>Pause</Text>
            </Pressable>
          ) : null}

          {(value.elapsed_seconds > 0 && !isRunning) && (
            <Pressable
              onPress={reset}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md },
  time: { ...typography.timer, color: colors.textPrimary },
  timeFinished: { color: colors.success500 },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.borderSubtle,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary500, borderRadius: radii.full },
  finishedLabel: { ...typography.buttonSmall, color: colors.success500 },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  primaryButtonText: { ...typography.buttonLarge, color: colors.textOnPrimary },
  warningButton: {
    backgroundColor: colors.warning500,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  warningButtonText: { ...typography.buttonLarge, color: colors.textOnPrimary },
  secondaryButton: {
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  secondaryButtonText: { ...typography.buttonLarge, color: colors.primary700 },
  buttonPressed: { opacity: 0.7 },
});
