import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import type { MultiNumberInputConfig } from '@/shared/tracking-elements/types/element-configs';
import type { MultiNumberInputValue } from '@/shared/tracking-elements/types/element-values';

interface MultiNumberInputElementProps {
  value: MultiNumberInputValue;
  onValueChange: (value: MultiNumberInputValue) => void;
  config: MultiNumberInputConfig;
}

export function MultiNumberInputElement({ value, onValueChange, config }: MultiNumberInputElementProps) {
  const [inputText, setInputText] = useState('');
  const hasTarget = config.targetEntries != null;
  const isAtTarget = hasTarget && value.values.length >= config.targetEntries!;

  const addEntry = () => {
    const parsed = parseFloat(inputText);
    if (isNaN(parsed)) return;
    onValueChange({ values: [...value.values, parsed] });
    setInputText('');
  };

  const removeEntry = (index: number) => {
    const newValues = value.values.filter((_, i) => i !== index);
    onValueChange({ values: newValues });
  };

  const average = value.values.length > 0
    ? value.values.reduce((sum, v) => sum + v, 0) / value.values.length
    : 0;

  return (
    <View style={styles.container}>
      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={addEntry}
          keyboardType="decimal-pad"
          placeholder="Enter value"
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="done"
        />
        {config.unit && <Text style={styles.unit}>{config.unit}</Text>}
        <Pressable
          onPress={addEntry}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {/* Stats */}
      {value.values.length > 0 && (
        <View style={styles.statsRow}>
          <Text style={[styles.stat, isAtTarget && styles.statAtTarget]}>
            Count: {value.values.length}
            {hasTarget ? ` / ${config.targetEntries}` : ''}
          </Text>
          <Text style={styles.stat}>Avg: {average.toFixed(1)}{config.unit ? ` ${config.unit}` : ''}</Text>
        </View>
      )}

      {/* Values list with swipe-to-delete */}
      {value.values.length > 0 && (
        <View style={styles.list}>
          {value.values.map((v, index) => (
            <SwipeToDeleteRow
              key={index}
              onDelete={() => removeEntry(index)}
              confirmTitle="Remove entry"
              confirmMessage={`Remove entry ${index + 1}?`}
            >
              <View style={styles.entryRow}>
                <Text style={styles.entryIndex}>{index + 1}.</Text>
                <Text style={styles.entryValue}>
                  {v}{config.unit ? ` ${config.unit}` : ''}
                </Text>
              </View>
            </SwipeToDeleteRow>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unit: { ...typography.bodySmall, color: colors.textSecondary },
  addButton: {
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    minHeight: touchTargets.min,
    justifyContent: 'center',
  },
  addButtonPressed: { opacity: 0.7 },
  addButtonText: { ...typography.buttonSmall, color: colors.textOnPrimary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.xxs },
  stat: { ...typography.caption, color: colors.textSecondary },
  statAtTarget: { color: colors.success500 },
  list: {},
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  entryIndex: { ...typography.caption, color: colors.textPlaceholder, width: 28 },
  entryValue: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
