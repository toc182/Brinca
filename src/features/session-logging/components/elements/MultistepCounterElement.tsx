import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

  const advanceStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completed all substeps -> increment rep
      onValueChange({ reps: value.reps + 1 });
      setCurrentStep(0);
    }
  };

  const resetStep = () => {
    setCurrentStep(0);
  };

  const undoRep = () => {
    if (value.reps > 0) {
      onValueChange({ reps: value.reps - 1 });
    }
  };

  return (
    <View style={styles.container}>
      {/* Rep counter */}
      <View style={styles.repRow}>
        <Text style={styles.repLabel}>Reps</Text>
        <Text style={[styles.repCount, isAtTarget && styles.repAtTarget]}>{value.reps}</Text>
        {hasTarget && <Text style={styles.target}>/ {config.targetReps}</Text>}
      </View>

      {/* Substep chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <View style={styles.chipRow}>
          {config.substeps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <View
                key={step}
                style={[
                  styles.chip,
                  isCompleted && styles.chipCompleted,
                  isCurrent && styles.chipCurrent,
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
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={undoRep}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          disabled={value.reps === 0 && currentStep === 0}
        >
          <Text style={styles.secondaryButtonText}>Undo</Text>
        </Pressable>

        <Pressable
          onPress={advanceStep}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep < totalSteps - 1 ? 'Next Step' : 'Complete Rep'}
          </Text>
        </Pressable>

        {currentStep > 0 && (
          <Pressable
            onPress={resetStep}
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
    gap: spacing.md,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  repLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  repCount: {
    ...typography.counter,
    color: colors.textPrimary,
  },
  repAtTarget: {
    color: colors.success500,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceDisabled,
  },
  chipCompleted: {
    backgroundColor: colors.success50,
  },
  chipCurrent: {
    backgroundColor: colors.primary500,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextCompleted: {
    color: colors.success500,
  },
  chipTextCurrent: {
    color: colors.textOnPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    ...typography.buttonSmall,
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: touchTargets.adult,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.buttonSmall,
    color: colors.primary700,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
