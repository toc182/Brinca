import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { MultistepCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { MultistepCounterValue } from '@/shared/tracking-elements/types/element-values';

interface MultistepCounterElementProps {
  value: MultistepCounterValue;
  onValueChange: (value: MultistepCounterValue) => void;
  config: MultistepCounterConfig;
}

export function MultistepCounterElement({ value, onValueChange, config }: MultistepCounterElementProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = config.substeps.length;
  const hasTarget = config.targetReps != null;
  const isAtTarget = hasTarget && value.reps >= config.targetReps!;

  // Tap the current chip to advance to the next step (strict order enforced).
  const handleChipTap = (index: number) => {
    // Only the current chip is tappable; ignore taps on other chips.
    if (index !== currentStep) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last chip tapped: complete a rep, reset chips
      onValueChange({ reps: value.reps + 1 });
      setCurrentStep(0);
    }
  };

  // Long-press on the rep counter clears the current in-progress chip state
  // without changing the rep count.
  const handleRepLongPress = () => {
    if (currentStep === 0) return; // nothing in progress
    Alert.alert(
      'Clear in-progress rep',
      'Clear the current rep in progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCurrentStep(0) },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset progress',
      'Reset all progress to zero?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            onValueChange({ reps: 0 });
            setCurrentStep(0);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Rep counter — long-press clears in-progress rep */}
      <Pressable onLongPress={handleRepLongPress} delayLongPress={500} style={styles.repRow}>
        <Text style={styles.repLabel}>Reps</Text>
        <Text style={[styles.repCount, isAtTarget && styles.repAtTarget]}>{value.reps}</Text>
        {hasTarget && <Text style={styles.target}>/ {config.targetReps}</Text>}
      </Pressable>

      {/* Substep chips — tap current chip to advance */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <View style={styles.chipRow}>
          {config.substeps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <Pressable
                key={step}
                onPress={() => handleChipTap(index)}
                style={({ pressed }) => [
                  styles.chip,
                  isCompleted && styles.chipCompleted,
                  isCurrent && styles.chipCurrent,
                  !isCurrent && pressed && { opacity: 0.5 },
                  isCurrent && pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isCompleted && styles.chipTextCompleted,
                    isCurrent && styles.chipTextCurrent,
                  ]}
                >
                  {step}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Reset button */}
      {(value.reps > 0 || currentStep > 0) && (
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.resetText}>Reset all</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  repRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  repLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  repCount: { ...typography.counter, color: colors.textPrimary },
  repAtTarget: { color: colors.success500 },
  target: { ...typography.caption, color: colors.textSecondary },
  chipScroll: { flexGrow: 0 },
  chipRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceDisabled,
  },
  chipCompleted: { backgroundColor: colors.success50 },
  chipCurrent: { backgroundColor: colors.primary500 },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextCompleted: { color: colors.success500 },
  chipTextCurrent: { color: colors.textOnPrimary },
  resetButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  resetText: { ...typography.caption, color: colors.error500 },
});
