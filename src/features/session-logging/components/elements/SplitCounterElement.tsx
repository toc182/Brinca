import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { SplitCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { SplitCounterValue } from '@/shared/tracking-elements/types/element-values';

interface SplitCounterElementProps {
  value: SplitCounterValue;
  onValueChange: (value: SplitCounterValue) => void;
  config: SplitCounterConfig;
}

export function SplitCounterElement({ value, onValueChange, config }: SplitCounterElementProps) {
  const leftAtTarget = config.targetLeft != null && value.left >= config.targetLeft;
  const rightAtTarget = config.targetRight != null && value.right >= config.targetRight;

  return (
    <View style={styles.container}>
      {/* Left counter */}
      <View style={styles.side}>
        <Text style={styles.label}>{config.leftLabel}</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => value.left > 0 && onValueChange({ ...value, left: value.left - 1 })}
            style={({ pressed }) => [
              styles.button,
              styles.buttonMinus,
              pressed && styles.buttonPressed,
              value.left === 0 && styles.buttonDisabled,
            ]}
            disabled={value.left === 0}
          >
            <Text style={[styles.buttonText, value.left === 0 && styles.buttonTextDisabled]}>-</Text>
          </Pressable>
          <Text style={[styles.count, leftAtTarget && styles.countAtTarget]}>{value.left}</Text>
          <Pressable
            onPress={() => onValueChange({ ...value, left: value.left + 1 })}
            style={({ pressed }) => [styles.button, styles.buttonPlus, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonTextLight}>+</Text>
          </Pressable>
        </View>
        {config.targetLeft != null && (
          <Text style={styles.target}>/ {config.targetLeft}</Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* Right counter */}
      <View style={styles.side}>
        <Text style={styles.label}>{config.rightLabel}</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => value.right > 0 && onValueChange({ ...value, right: value.right - 1 })}
            style={({ pressed }) => [
              styles.button,
              styles.buttonMinus,
              pressed && styles.buttonPressed,
              value.right === 0 && styles.buttonDisabled,
            ]}
            disabled={value.right === 0}
          >
            <Text style={[styles.buttonText, value.right === 0 && styles.buttonTextDisabled]}>-</Text>
          </Pressable>
          <Text style={[styles.count, rightAtTarget && styles.countAtTarget]}>{value.right}</Text>
          <Pressable
            onPress={() => onValueChange({ ...value, right: value.right + 1 })}
            style={({ pressed }) => [styles.button, styles.buttonPlus, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonTextLight}>+</Text>
          </Pressable>
        </View>
        {config.targetRight != null && (
          <Text style={styles.target}>/ {config.targetRight}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
    alignSelf: 'stretch',
    marginHorizontal: spacing.sm,
  },
  button: {
    width: touchTargets.adult,
    height: touchTargets.adult,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMinus: {
    backgroundColor: colors.primary50,
  },
  buttonPlus: {
    backgroundColor: colors.primary500,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceDisabled,
  },
  buttonText: {
    ...typography.buttonSmall,
    color: colors.primary700,
  },
  buttonTextLight: {
    ...typography.buttonSmall,
    color: colors.textOnPrimary,
  },
  buttonTextDisabled: {
    color: colors.textDisabled,
  },
  count: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  countAtTarget: {
    color: colors.success500,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
