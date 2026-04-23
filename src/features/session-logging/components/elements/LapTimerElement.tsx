import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import type { LapTimerConfig } from '@/shared/tracking-elements/types/element-configs';
import type { LapTimerValue } from '@/shared/tracking-elements/types/element-values';

const elementTimerStorage = createMMKV({ id: 'element-timers' });

interface LapTimerElementProps {
  value: LapTimerValue;
  onValueChange: (value: LapTimerValue) => void;
  config: LapTimerConfig;
  elementId?: string;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function LapTimerElement({ value, onValueChange, config, elementId }: LapTimerElementProps) {
  const [isRunning, setIsRunning] = useState(false);
  const mmkvKey = elementId ? `lt_start_${elementId}` : null;
  const persistedStart = mmkvKey ? elementTimerStorage.getNumber(mmkvKey) : null;
  const startTimeRef = useRef<number | null>(persistedStart ?? null);
  const baseElapsedRef = useRef(
    persistedStart != null
      ? value.total_elapsed + (Date.now() - persistedStart) / 1000
      : value.total_elapsed
  );
  const lastLapElapsedRef = useRef(value.laps.reduce((sum, l) => sum + l, 0));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasLapTarget = config.targetLaps != null;
  const isAtLapTarget = hasLapTarget && value.laps.length >= config.targetLaps!;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    const now = Date.now();
    startTimeRef.current = now;
    baseElapsedRef.current = value.total_elapsed;
    if (mmkvKey) elementTimerStorage.set(mmkvKey, now);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current != null) {
        const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
        onValueChange({ ...value, total_elapsed: elapsed });
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
      onValueChange({ ...value, total_elapsed: elapsed });
      startTimeRef.current = null;
    }
  };

  const lap = () => {
    if (!isRunning || startTimeRef.current == null) return;
    const currentTotal = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
    const lapTime = currentTotal - lastLapElapsedRef.current;
    lastLapElapsedRef.current = currentTotal;
    const newLaps = [...value.laps, lapTime];
    onValueChange({ laps: newLaps, total_elapsed: currentTotal });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset timer',
      'Reset timer and delete all laps?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            if (mmkvKey) elementTimerStorage.remove(mmkvKey);
            startTimeRef.current = null;
            baseElapsedRef.current = 0;
            lastLapElapsedRef.current = 0;
            onValueChange({ laps: [], total_elapsed: 0 });
          },
        },
      ]
    );
  };

  const deleteLap = (index: number) => {
    const newLaps = value.laps.filter((_, i) => i !== index);
    onValueChange({ ...value, laps: newLaps });
  };

  const currentLapTime = value.total_elapsed - lastLapElapsedRef.current;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(value.total_elapsed)}</Text>

      {isRunning && (
        <Text style={styles.lapTime}>Lap {value.laps.length + 1}: {formatTime(Math.max(0, currentLapTime))}</Text>
      )}

      {hasLapTarget && (
        <Text style={[styles.target, isAtLapTarget && styles.targetReached]}>
          {value.laps.length} / {config.targetLaps} laps
        </Text>
      )}

      <View style={styles.buttonRow}>
        {!isRunning ? (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>
              {value.total_elapsed > 0 ? 'Resume' : 'Start'}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={lap}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>Lap</Text>
            </Pressable>
            <Pressable
              onPress={pause}
              style={({ pressed }) => [styles.warningButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.warningButtonText}>Pause</Text>
            </Pressable>
          </>
        )}

        {value.total_elapsed > 0 && !isRunning && (
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </Pressable>
        )}
      </View>

      {/* Lap list with swipe-to-delete */}
      {value.laps.length > 0 && (
        <View style={styles.lapList}>
          {value.laps.map((lapSec, index) => {
            const isGoodLap = config.targetLapTimeSeconds != null && lapSec <= config.targetLapTimeSeconds;
            return (
              <SwipeToDeleteRow
                key={index}
                onDelete={() => deleteLap(index)}
                confirmTitle="Delete lap"
                confirmMessage={`Delete Lap ${index + 1}?`}
              >
                <View style={styles.lapRow}>
                  <Text style={styles.lapLabel}>Lap {index + 1}</Text>
                  <Text style={[styles.lapValue, isGoodLap && styles.lapValueGood]}>
                    {formatTime(lapSec)}
                  </Text>
                </View>
              </SwipeToDeleteRow>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md },
  time: { ...typography.timer, color: colors.textPrimary },
  lapTime: { ...typography.bodySmall, color: colors.textSecondary },
  target: { ...typography.caption, color: colors.textSecondary },
  targetReached: { color: colors.success500 },
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
  lapList: { width: '100%' },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  lapLabel: { ...typography.bodySmall, color: colors.textSecondary },
  lapValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  lapValueGood: { color: colors.success500 },
});
