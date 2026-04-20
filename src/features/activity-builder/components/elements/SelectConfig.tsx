import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { colors, spacing, radii } from '@/shared/theme';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

/** Shared config for single_select and multi_select — both have an options list. */
export function SelectConfig({ elementId, config, onConfigChange }: Props) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>(
    Array.isArray(config.options) ? (config.options as { id: string; name: string }[]) : [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }]
  );

  const save = async (updated: { id: string; name: string }[]) => {
    await updateElement(elementId, { config: { ...config, options: updated } });
    onConfigChange();
  };

  const addOption = () => {
    const updated = [...options, { id: randomUUID(), name: `Option ${options.length + 1}` }];
    setOptions(updated);
    save(updated);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    save(updated);
  };

  const updateOption = (index: number, name: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], name };
    setOptions(updated);
  };

  return (
    <View style={styles.container}>
      {options.map((option, i) => (
        <View key={option.id} style={styles.row}>
          <Input label={`Option ${i + 1}`} value={option.name} onChangeText={(v) => updateOption(i, v)} onBlur={() => save(options)} style={styles.input} />
          {options.length > 2 && (
            <Pressable onPress={() => removeOption(i)} style={styles.removeButton}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Button title="Add option" onPress={addOption} variant="text" size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xs, gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  input: { flex: 1 },
  removeButton: { width: 32, height: 32, borderRadius: radii.full, backgroundColor: colors.error50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  removeText: { color: colors.error600, fontWeight: '700', fontSize: 14 },
});
