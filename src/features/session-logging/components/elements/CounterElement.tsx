import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { CounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { CounterValue } from '@/shared/tracking-elements/types/element-values';

interface CounterElementProps {
  value: CounterValue;
  onValueChange: (value: CounterValue) => void;
  config: CounterConfig;
}

export function CounterElement({ value, onValueChange, config }: CounterElementProps) {
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  const decrement = () => {
    if (count > 0) {
      onValueChange({ count: count - 1 });
    }
  };

  const increment = () => {
    onValueChange({ count: count + 1 });
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={decrement}
        style={({ pressed }) => [
          styles.button,
          styles.buttonMinus,
          pressed && styles.buttonPressed,
          count === 0 && styles.buttonDisabled,
        ]}
        disabled={count === 0}
      >
        <Text style={[styles.buttonText, count === 0 && styles.buttonTextDisabled]}>-</Text>
      </Pressable>

      <View style={styles.countContainer}>
        <Text style={[styles.count, isAtTarget && styles.countAtTarget]}>{count}</Text>
        {hasTarget && (
          <Text style={styles.target}>/ {config.target}</Text>
        )}
      </View>

      <Pressable
        onPress={increment}
        style={({ pressed }) => [styles.button, styles.buttonPlus, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  button: {
    width: touchTargets.kid,
    height: touchTargets.kid,
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
    ...typography.titleMedium,
    color: colors.primary700,
  },
  buttonTextDisabled: {
    color: colors.textDisabled,
  },
  countContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  count: {
    ...typography.counter,
    color: colors.textPrimary,
  },
  countAtTarget: {
    color: colors.success500,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
