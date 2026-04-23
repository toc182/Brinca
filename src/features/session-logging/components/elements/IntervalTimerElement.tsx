import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMMKV } from 'react-native-mmkv';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
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
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);

  const mmkvKey = elementId ? `it_start_${elementId}` : null;
  const persistedStart = mmkvKey ? elementTimerStorage.getNumber(mmkvKey) : null;

  const phaseStartRef = useRef<number | null>(null);
  const basePhaseDurationRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef(value.completed_cycles);
  const skippedRef = useRef(value.skipped_phases);
  const totalStartRef = useRef<number | null>(persistedStart ?? null);
  const baseTotalRef = useRef(
    persistedStart != null
      ? value.total_elapsed + (Date.now() - persistedStart) / 1000
      : value.total_elapsed
  );

  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const isComplete = value.completed_cycles >= config.cycles;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const showPhaseBanner = (label: string) => {
    setPhaseBanner(label);
    bannerOpacity.setValue(1);
    Animated.timing(bannerOpacity, { toValue: 0, duration: 2000, delay: 500, useNativeDriver: true }).start(() => {
      setPhaseBanner(null);
    });
  };

  const onPhaseTransition = (newPhase: Phase) => {
    // Vibrate once and trigger haptic at each phase transition
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPhaseBanner(newPhase === 'work' ? 'WORK' : 'REST');
  };

  const tick = () => {
    if (phaseStartRef.current == null) return;

    const phaseElapsed = basePhaseDurationRef.current + (Date.now() - phaseStartRef.current) / 1000;
    const phaseDuration = phase === 'work' ? config.workDurationSeconds : config.restDurationSeconds;
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
    if (phase === 'work') {
      setPhase('rest');
      setPhaseRemaining(config.restDurationSeconds);
      basePhaseDurationRef.current = 0;
      phaseStartRef.current = Date.now();
      onPhaseTransition('rest');
    } else {
      const newCycles = cycleRef.current + 1;
      cycleRef.current = newCycles;

      if (newCycles >= config.cycles) {
        // All complete — haptic for completion
        stop();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (totalStartRef.current != null) {
          const totalElapsed = baseTotalRef.current + (Date.now() - totalStartRef.current) / 1000;
          onValueChange({ completed_cycles: newCycles, total_elapsed: totalElapsed, skipped_phases: skippedRef.current });
        }
        return;
      }

      setPhase('work');
      setPhaseRemaining(config.workDurationSeconds);
      basePhaseDurationRef.current = 0;
      phaseStartRef.current = Date.now();
      onPhaseTransition('work');
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
    <View style={styles.container}>
      {/* Phase transition banner */}
      {phaseBanner && (
        <Animated.View style={[styles.phaseBannerContainer, { opacity: bannerOpacity }]}>
          <Text style={styles.phaseBannerText}>{phaseBanner}</Text>
        </Animated.View>
      )}

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
            onPress={handleReset}
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
  container: { alignItems: 'center', gap: spacing.md },
  phaseBannerContainer: {
    position: 'absolute',
    top: -20,
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    zIndex: 10,
  },
  phaseBannerText: { ...typography.buttonSmall, color: colors.textOnPrimary },
  phaseBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderRadius: radii.full },
  workBadge: { backgroundColor: colors.accent500 },
  restBadge: { backgroundColor: colors.secondary500 },
  phaseText: { ...typography.captionSmall, color: colors.textOnPrimary, textTransform: 'uppercase' },
  time: { ...typography.timer, color: colors.textPrimary },
  cycleInfo: { ...typography.bodySmall, color: colors.textSecondary },
  completeLabel: { ...typography.buttonSmall, color: colors.success500 },
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
