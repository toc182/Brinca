import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMMKV } from 'react-native-mmkv';
import { ArrowCounterClockwise, Pause, Play, SkipForward } from 'phosphor-react-native';

import { IconButton } from '@/shared/components/IconButton';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { IntervalTimerConfig } from '@/shared/tracking-elements/types/element-configs';
import type { IntervalTimerValue } from '@/shared/tracking-elements/types/element-values';

const elementTimerStorage = createMMKV({ id: 'element-timers' });

interface IntervalTimerElementProps {
  value: IntervalTimerValue;
  onValueChange: (value: IntervalTimerValue) => void;
  config: IntervalTimerConfig;
  elementId?: string;
}

type Phase = 'work' | 'rest';

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function IntervalTimerElement({ value, onValueChange, config, elementId }: IntervalTimerElementProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('work');
  const [phaseRemaining, setPhaseRemaining] = useState(config.workDurationSeconds);

  const mmkvKey = elementId ? `it_start_${elementId}` : null;
  const persistedStart = mmkvKey ? elementTimerStorage.getNumber(mmkvKey) : null;

  const phaseStartRef = useRef<number | null>(null);
  const basePhaseDurationRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('work');
  const cycleRef = useRef(value.completed_cycles);
  const skippedRef = useRef(value.skipped_phases);
  const totalStartRef = useRef<number | null>(persistedStart ?? null);
  const baseTotalRef = useRef(
    persistedStart != null
      ? value.total_elapsed + (Date.now() - persistedStart) / 1000
      : value.total_elapsed
  );

  const isComplete = value.completed_cycles >= config.cycles;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // A single firm haptic on each work↔rest transition. The persistent colored
  // band shows which phase you're in, so no transient pop-up banner is needed.
  const onPhaseTransition = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const tick = () => {
    if (phaseStartRef.current == null) return;

    const phaseElapsed = basePhaseDurationRef.current + (Date.now() - phaseStartRef.current) / 1000;
    const phaseDuration = phaseRef.current === 'work' ? config.workDurationSeconds : config.restDurationSeconds;
    const remaining = Math.max(0, phaseDuration - phaseElapsed);
    setPhaseRemaining(remaining);

    if (totalStartRef.current != null) {
      const totalElapsed = baseTotalRef.current + (Date.now() - totalStartRef.current) / 1000;
      onValueChange({
        completed_cycles: cycleRef.current,
        total_elapsed: totalElapsed,
        skipped_phases: skippedRef.current,
      });
    }

    if (remaining <= 0) {
      advancePhase();
    }
  };

  const advancePhase = () => {
    if (phaseRef.current === 'work') {
      phaseRef.current = 'rest';
      setPhase('rest');
      setPhaseRemaining(config.restDurationSeconds);
      basePhaseDurationRef.current = 0;
      phaseStartRef.current = Date.now();
      onPhaseTransition();
    } else {
      const newCycles = cycleRef.current + 1;
      cycleRef.current = newCycles;

      if (newCycles >= config.cycles) {
        // Capture elapsed BEFORE stop() (which nulls totalStartRef), then record
        // the completion unconditionally. The old code read totalStartRef after
        // stop() had already nulled it, so completed_cycles never reached the
        // target — the timer looked unfinished and offered a phantom Resume.
        const totalElapsed =
          totalStartRef.current != null
            ? baseTotalRef.current + (Date.now() - totalStartRef.current) / 1000
            : value.total_elapsed;
        stop();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onValueChange({ completed_cycles: newCycles, total_elapsed: totalElapsed, skipped_phases: skippedRef.current });
        return;
      }

      phaseRef.current = 'work';
      setPhase('work');
      setPhaseRemaining(config.workDurationSeconds);
      basePhaseDurationRef.current = 0;
      phaseStartRef.current = Date.now();
      onPhaseTransition();
    }
  };

  const start = () => {
    if (isComplete) return;
    const now = Date.now();
    phaseStartRef.current = now;
    basePhaseDurationRef.current = 0;
    totalStartRef.current = now;
    baseTotalRef.current = value.total_elapsed;
    if (mmkvKey) elementTimerStorage.set(mmkvKey, now);
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
  };

  const stop = () => {
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mmkvKey) elementTimerStorage.remove(mmkvKey);
    phaseStartRef.current = null;
    totalStartRef.current = null;
  };

  const pause = () => {
    stop();
    baseTotalRef.current = value.total_elapsed;
  };

  const skip = () => {
    if (!isRunning) return;
    skippedRef.current += 1;
    advancePhase();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset timer',
      'Reset interval timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            stop();
            phaseRef.current = 'work';
            setPhase('work');
            setPhaseRemaining(config.workDurationSeconds);
            basePhaseDurationRef.current = 0;
            cycleRef.current = 0;
            skippedRef.current = 0;
            baseTotalRef.current = 0;
            onValueChange({ completed_cycles: 0, total_elapsed: 0, skipped_phases: 0 });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.row}>
      {/* Left column: phase chip + cycle count, then the time, then dots. */}
      <View style={styles.info}>
        <View style={styles.chipRow}>
          {isComplete ? (
            <Text style={styles.completeLabel}>Complete!</Text>
          ) : (
            <>
              <View style={[styles.phaseChip, phase === 'work' ? styles.workChip : styles.restChip]}>
                <Text style={styles.phaseChipText}>{phase === 'work' ? 'WORK' : 'REST'}</Text>
              </View>
              <Text style={styles.cycleInfo}>
                {`Cycle ${Math.min(value.completed_cycles + 1, config.cycles)} / ${config.cycles}`}
              </Text>
            </>
          )}
        </View>

        <Text style={styles.time} numberOfLines={1} adjustsFontSizeToFit>
          {formatTime(phaseRemaining)}
        </Text>

        <View style={styles.dotsRow}>
          {Array.from({ length: config.cycles }).map((_, i) => {
            const done = i < value.completed_cycles;
            const current = i === value.completed_cycles && !isComplete;
            return <View key={i} style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]} />;
          })}
        </View>
      </View>

      {/* Right column: stacked circular controls (same family as stopwatch). */}
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
              onPress={skip}
              accessibilityRole="button"
              accessibilityLabel="Skip phase"
              style={({ pressed }) => [styles.labeledCircle, pressed && styles.buttonPressed]}
            >
              <SkipForward size={16} color={colors.primary500} weight="bold" />
              <Text style={styles.labeledCircleText}>Skip</Text>
            </Pressable>
          </>
        ) : (
          <>
            {!isComplete && (
              <Pressable
                onPress={start}
                accessibilityRole="button"
                accessibilityLabel={value.total_elapsed > 0 ? 'Resume' : 'Start'}
                style={({ pressed }) => [styles.primaryCircle, pressed && styles.buttonPressed]}
              >
                <Play size={24} color={colors.textOnPrimary} weight="fill" />
              </Pressable>
            )}
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
  );
}

const styles = StyleSheet.create({
  // Horizontal layout: info column on the left, stacked controls on the right.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  info: { flex: 1, minWidth: 0, gap: spacing.xs },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  phaseChip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxxs,
  },
  workChip: { backgroundColor: colors.accent500 },
  restChip: { backgroundColor: colors.secondary500 },
  phaseChipText: { ...typography.captionSmall, color: colors.textOnPrimary, letterSpacing: 0.6 },
  cycleInfo: { ...typography.bodySmall, color: colors.textSecondary },
  completeLabel: { ...typography.titleSmall, color: colors.success500 },
  time: { ...typography.timer, color: colors.textPrimary },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: { width: 9, height: 9, borderRadius: radii.full, backgroundColor: colors.primary100 },
  dotDone: { backgroundColor: colors.primary500 },
  dotCurrent: { width: 13, height: 13, borderRadius: radii.full, backgroundColor: colors.primary500 },
  controls: { alignItems: 'center', gap: spacing.sm },
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
  primaryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.7 },
});
