import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Minus, Plus } from 'phosphor-react-native';

import { IconButton } from '@/shared/components/IconButton';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { CombinedCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { CombinedCounterValue } from '@/shared/tracking-elements/types/element-values';

interface CombinedCounterElementProps {
  value: CombinedCounterValue;
  onValueChange: (value: CombinedCounterValue) => void;
  config: CombinedCounterConfig;
}

/**
 * Editable Counter — a counter with −/+ buttons whose number can also be tapped
 * to type a value directly (handy for large counts). Buttons match the regular
 * Counter (outline minus, filled plus); the number sits in a bordered field so
 * it reads as tappable/editable rather than plain text.
 */
export function CombinedCounterElement({ value, onValueChange, config }: CombinedCounterElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  const decrement = () => {
    if (count > 0) onValueChange({ count: count - 1 });
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

  const handleReset = () => {
    Alert.alert('Reset counter', 'Reset counter to zero?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => onValueChange({ count: 0 }) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.counterRow}>
        <IconButton
          icon={Minus}
          variant="outline"
          size={64}
          disabled={count === 0}
          onPress={decrement}
          accessibilityLabel="Remove one"
        />

        <View style={styles.countContainer}>
          {isEditing ? (
            <View style={styles.field}>
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
            </View>
          ) : (
            <Pressable
              onPress={startEditing}
              accessibilityRole="button"
              accessibilityLabel="Tap to type a number"
              style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
            >
              <Text style={[styles.count, isAtTarget && styles.countAtTarget]}>{count}</Text>
            </Pressable>
          )}
          {hasTarget && <Text style={styles.target}>/ {config.target}</Text>}
        </View>

        <IconButton
          icon={Plus}
          variant="filled"
          size={64}
          onPress={increment}
          accessibilityLabel="Add one"
        />
      </View>

      {count > 0 && (
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  countContainer: { alignItems: 'center', gap: spacing.xxs, minWidth: 96 },
  // Bordered field so the number reads as a tappable/typeable input, not plain
  // text — flanked by the −/+ buttons it looks like a number entry field.
  field: {
    borderWidth: 1.5,
    borderColor: colors.primary100,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    minWidth: 88,
    alignItems: 'center',
  },
  fieldPressed: { backgroundColor: colors.primary50 },
  count: { ...typography.counter, color: colors.textPrimary, textAlign: 'center' },
  countAtTarget: { color: colors.success500 },
  input: {
    ...typography.counter,
    color: colors.textPrimary,
    textAlign: 'center',
    minWidth: 64,
    padding: 0,
  },
  target: { ...typography.caption, color: colors.textSecondary },
  resetButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  resetPressed: { opacity: 0.7 },
  resetText: { ...typography.caption, color: colors.error500 },
});
