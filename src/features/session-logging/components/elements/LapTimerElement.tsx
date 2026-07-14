import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { ArrowCounterClockwise, Flag, Pause, Play } from 'phosphor-react-native';

import { IconButton } from '@/shared/components/IconButton';
import { colors, fontFamilies, typography, spacing, radii } from '@/shared/theme';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { formatTimerWithCentiseconds } from '@/shared/utils/formatTimer';
import type { LapTimerConfig } from '@/shared/tracking-elements/types/element-configs';
import type { LapTimerValue } from '@/shared/tracking-elements/types/element-values';

const elementTimerStorage = createMMKV({ id: 'element-timers' });

// Centisecond display requires a sub-100ms tick so the trailing two digits
// animate smoothly rather than chunking by 10.
const TICK_INTERVAL_MS = 33;

interface LapTimerElementProps {
  value: LapTimerValue;
  onValueChange: (value: LapTimerValue) => void;
  config: LapTimerConfig;
  elementId?: string;
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
  // Latest value so the running tick preserves laps added mid-run. Without this
  // the tick spreads a stale `value` closure and overwrites a just-added lap on
  // the next 33ms tick (the lap "pops and disappears").
  const valueRef = useRef(value);
  valueRef.current = value;

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
        onValueChange({ ...valueRef.current, total_elapsed: elapsed });
      }
    }, TICK_INTERVAL_MS);
  };

  const pause = () => {
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mmkvKey) elementTimerStorage.remove(mmkvKey);
    if (startTimeRef.current != null) {
      const elapsed = baseElapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
      baseElapsedRef.current = elapsed;
      onValueChange({ ...valueRef.current, total_elapsed: elapsed });
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
      {/* Horizontal layout matching the interval timer: info on the left,
          stacked circular controls on the right. */}
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.time} numberOfLines={1} adjustsFontSizeToFit>
            {formatTimerWithCentiseconds(value.total_elapsed)}
          </Text>

          {isRunning && (
            <Text style={styles.lapTime}>
              Lap {value.laps.length + 1}:{' '}
              <Text style={styles.lapTimeValue}>{formatTimerWithCentiseconds(Math.max(0, currentLapTime))}</Text>
            </Text>
          )}

          {hasLapTarget && (
            <Text style={[styles.target, isAtLapTarget && styles.targetReached]}>
              {value.laps.length} / {config.targetLaps} laps
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          {isRunning ? (
            <>
              <Pressable
                onPress={pause}
                accessibilityRole="button"
                accessibilityLabel="Pause"
                style={({ pressed }) => [styles.primaryCircle, pressed && styles.buttonPressed]}
              >
                <Pause size={24} color={colors.textOnPrimary} weight="fill" />
              </Pressable>
              <Pressable
                onPress={lap}
                accessibilityRole="button"
                accessibilityLabel="Record lap"
                style={({ pressed }) => [styles.labeledCircle, pressed && styles.buttonPressed]}
              >
                <Flag size={16} color={colors.primary500} weight="bold" />
                <Text style={styles.labeledCircleText}>Lap</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={start}
                accessibilityRole="button"
                accessibilityLabel={value.total_elapsed > 0 ? 'Resume' : 'Start'}
                style={({ pressed }) => [styles.primaryCircle, pressed && styles.buttonPressed]}
              >
                <Play size={24} color={colors.textOnPrimary} weight="fill" />
              </Pressable>
              {value.total_elapsed > 0 && (
                <IconButton
                  icon={ArrowCounterClockwise}
                  variant="outline"
                  size={52}
                  onPress={handleReset}
                  accessibilityLabel="Reset"
                />
              )}
            </>
          )}
        </View>
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
                    {formatTimerWithCentiseconds(lapSec)}
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
  container: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  info: { flex: 1, minWidth: 0, gap: spacing.xs },
  time: { ...typography.timer, color: colors.textPrimary },
  lapTime: { ...typography.bodySmall, color: colors.textSecondary },
  // Monospace for the running lap time so the line doesn't jitter as the
  // centiseconds tick — Lexend's digits are proportional and tabular-nums
  // has no effect on it.
  lapTimeValue: { fontFamily: fontFamilies.timer },
  target: { ...typography.caption, color: colors.textSecondary },
  targetReached: { color: colors.success500 },
  controls: { alignItems: 'center', gap: spacing.sm },
  primaryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Round like every other control; the tiny label inside keeps it unambiguous.
  labeledCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.primary500,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labeledCircleText: {
    ...typography.captionSmall,
    color: colors.primary500,
    lineHeight: 13,
    marginTop: 1,
  },
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
