import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { CombinedCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { CombinedCounterValue } from '@/shared/tracking-elements/types/element-values';

interface CombinedCounterElementProps {
  value: CombinedCounterValue;
  onValueChange: (value: CombinedCounterValue) => void;
  config: CombinedCounterConfig;
}

export function CombinedCounterElement({ value, onValueChange, config }: CombinedCounterElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
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

  const startEditing = () => {
    setEditText(String(count));
    setIsEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseInt(editText, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onValueChange({ count: parsed });
    }
    setIsEditing(false);
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
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editText}
            onChangeText={setEditText}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Pressable onPress={startEditing}>
            <Text style={[styles.count, isAtTarget && styles.countAtTarget]}>{count}</Text>
          </Pressable>
        )}
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
  input: {
    ...typography.counter,
    color: colors.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary500,
    minWidth: 80,
    padding: 0,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
