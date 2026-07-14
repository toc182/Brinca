import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, radii, spacing } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

interface Option {
  id: string;
  name: string;
}

/** Shared add-config for single_select and multi_select. */
export function SelectAddConfig({ value, onChange }: Props) {
  const [options, setOptions] = useState<Option[]>(
    Array.isArray(value.options) && (value.options as Option[]).length >= 2
      ? (value.options as Option[])
      : [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }],
  );
  const emit = (nextOptions: Option[]) => {
    const cleaned = nextOptions.map((o, i) => ({ ...o, name: o.name.trim() || `Option ${i + 1}` }));
    onChange({ ...value, options: cleaned });
  };

  const updateOption = (index: number, name: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], name };
    setOptions(updated);
    emit(updated);
  };

  const addOption = () => {
    const updated = [...options, { id: randomUUID(), name: `Option ${options.length + 1}` }];
    setOptions(updated);
    emit(updated);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    emit(updated);
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
