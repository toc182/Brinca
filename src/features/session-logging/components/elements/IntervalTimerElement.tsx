import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { IntervalTimerConfig } from '@/shared/tracking-elements/types/element-configs';
import type { IntervalTimerValue } from '@/shared/tracking-elements/types/element-values';

interface IntervalTimerElementProps {
  value: IntervalTimerValue;
  onValueChange: (value: IntervalTimerValue) => void;
  config: IntervalTimerConfig;
}

type Phase = 'work' | 'rest';

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function IntervalTimerElement({ value, onValueChange, config }: IntervalTimerElementProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('work');
  const [phaseRemaining, setPhaseRemaining] = useState(config.workDurationSeconds);
  const phaseStartRef = useRef<number | null>(null);
  const basePhaseDurationRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef(value.completed_cycles);
  const skippedRef = useRef(value.skipped_phases);
  const totalStartRef = useRef<number | null>(null);
  const baseTotalRef = useRef(value.total_elapsed);

  const isComplete = value.completed_cycles >= config.cycles;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tick = () => {
    if (phaseStartRef.current == null) return;

    const phaseElapsed = basePhaseDurationRef.current + (Date.now() - phaseStartRef.current) / 1000;
    const phaseDuration = phase === 'work' ? config.workDurationSeconds : config.restDurationSeconds;
    const remaining = Math.max(0, phaseDuration - phaseElapsed);
    setPhaseRemaining(remaining);

    // Update total elapsed
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
    if (phase === 'work') {
      // Work done -> move to rest
      setPhase('rest');
      setPhaseRemaining(config.restDurationSeconds);
      basePhaseDurationRef.current = 0;
      phaseStartRef.current = Date.now();
    } else {
      // Rest done -> complete a cycle
      const newCycles = cycleRef.current + 1;
      cycleRef.current = newCycles;

      if (newCycles >= config.cycles) {
        // All done
        stop();
        if (totalStartRef.current != null) {
          const totalElapsed = baseTotalRef.current + (Date.now() - totalStartRef.current) / 1000;
          onValueChange({
            completed_cycles: newCycles,
            total_elapsed: totalElapsed,
            skipped_phases: skippedRef.current,
          });
        }
        return;
      }

      setPhase('work');
      setPhaseRemaining(config.workDurationSeconds);
      basePhaseDurationRef.current = 0;
      phaseStartRef.current = Date.now();
    }
  };

  const start = () => {
    if (isComplete) return;
    phaseStartRef.current = Date.now();
    basePhaseDurationRef.current = 0;
    totalStartRef.current = Date.now();
    baseTotalRef.current = value.total_elapsed;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
  };

  const stop = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    phaseStartRef.current = null;
    totalStartRef.current = null;
  };

  const pause = () => {
    stop();
    if (totalStartRef.current != null) {
      baseTotalRef.current = value.total_elapsed;
    }
  };

  const skip = () => {
    if (!isRunning) return;
    skippedRef.current += 1;
    advancePhase();
  };

  const reset = () => {
    stop();
    setPhase('work');
    setPhaseRemaining(config.workDurationSeconds);
    basePhaseDurationRef.current = 0;
    cycleRef.current = 0;
    skippedRef.current = 0;
    baseTotalRef.current = 0;
    onValueChange({ completed_cycles: 0, total_elapsed: 0, skipped_phases: 0 });
  };

  return (
    <View style={styles.container}>
      {/* Phase indicator */}
      <View style={[styles.phaseBadge, phase === 'work' ? styles.workBadge : styles.restBadge]}>
        <Text style={styles.phaseText}>{phase === 'work' ? 'WORK' : 'REST'}</Text>
      </View>

      <Text style={styles.time}>{formatTime(phaseRemaining)}</Text>

      <Text style={styles.cycleInfo}>
        Cycle {Math.min(value.completed_cycles + 1, config.cycles)} / {config.cycles}
      </Text>

      {isComplete && <Text style={styles.completeLabel}>Complete!</Text>}

      <View style={styles.buttonRow}>
        {!isRunning && !isComplete ? (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>
              {value.total_elapsed > 0 ? 'Resume' : 'Start'}
            </Text>
          </Pressable>
        ) : isRunning ? (
          <>
            <Pressable
              onPress={skip}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>Skip</Text>
            </Pressable>
            <Pressable
              onPress={pause}
              style={({ pressed }) => [styles.warningButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.warningButtonText}>Pause</Text>
            </Pressable>
          </>
        ) : null}

        {value.total_elapsed > 0 && !isRunning && (
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
  phaseBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  workBadge: {
    backgroundColor: colors.accent500,
  },
  restBadge: {
    backgroundColor: colors.secondary500,
  },
  phaseText: {
    ...typography.captionSmall,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  time: {
    ...typography.timer,
    color: colors.textPrimary,
  },
  cycleInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  completeLabel: {
    ...typography.buttonSmall,
    color: colors.success500,
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
