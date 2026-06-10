import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, radii, spacing } from '@/shared/theme';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';

interface Props {
  type: ElementType;
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

interface Option {
  id: string;
  name: string;
}

/** Shared add-config for single_select and multi_select. */
export function SelectAddConfig({ type, value, onChange }: Props) {
  const [options, setOptions] = useState<Option[]>(
    Array.isArray(value.options) && (value.options as Option[]).length >= 2
      ? (value.options as Option[])
      : [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }],
  );
  const [targetOption, setTargetOption] = useState(String(value.targetOption ?? ''));
  const [targetCount, setTargetCount] = useState(value.targetCount != null ? String(value.targetCount) : '');

  const emit = (nextOptions: Option[], nextTargetOption: string, nextTargetCount: string) => {
    const cleaned = nextOptions.map((o, i) => ({ ...o, name: o.name.trim() || `Option ${i + 1}` }));
    const parsedCount = nextTargetCount.trim() ? parseInt(nextTargetCount, 10) : NaN;
    onChange({
      ...value,
      options: cleaned,
      targetOption: type === 'single_select' ? (nextTargetOption.trim() || undefined) : undefined,
      targetCount: type === 'multi_select' && !isNaN(parsedCount) ? parsedCount : undefined,
    });
  };

  const updateOption = (index: number, name: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], name };
    setOptions(updated);
    emit(updated, targetOption, targetCount);
  };

  const addOption = () => {
    const updated = [...options, { id: randomUUID(), name: `Option ${options.length + 1}` }];
    setOptions(updated);
    emit(updated, targetOption, targetCount);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    emit(updated, targetOption, targetCount);
  };

  const handleTargetOption = (text: string) => {
    setTargetOption(text);
    emit(options, text, targetCount);
  };

  const handleTargetCount = (text: string) => {
    setTargetCount(text);
    emit(options, targetOption, text);
  };

  return (
    <View style={styles.container}>
      {options.map((option, i) => (
        <View key={option.id} style={styles.row}>
          <Input
            label={`Option ${i + 1}`}
            value={option.name}
            onChangeText={(v) => updateOption(i, v)}
            style={styles.input}
          />
          {options.length > 2 && (
            <Pressable onPress={() => removeOption(i)} style={styles.removeButton}>
              <Text style={styles.removeText}>{'✕'}</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Button title="Add option" onPress={addOption} variant="text" size="small" />
      {type === 'single_select' && (
        <Input
          label="Target option (optional)"
          value={targetOption}
          onChangeText={handleTargetOption}
          placeholder="e.g. Option 1"
        />
      )}
      {type === 'multi_select' && (
        <Input
          label="Target number selected (optional)"
          value={targetCount}
          onChangeText={handleTargetCount}
          keyboardType="number-pad"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  input: { flex: 1 },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.error50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  removeText: { color: colors.error600, fontWeight: '700', fontSize: 14 },
});
