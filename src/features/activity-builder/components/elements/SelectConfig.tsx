import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { colors, spacing, radii } from '@/shared/theme';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  type: ElementType;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

/** Shared config for single_select and multi_select — both have an options list. */
export function SelectConfig({ elementId, type, config, onConfigChange }: Props) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>(
    Array.isArray(config.options) ? (config.options as { id: string; name: string }[]) : [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }]
  );
  const [targetOption, setTargetOption] = useState(String(config.targetOption ?? ''));
  const [targetCount, setTargetCount] = useState(String(config.targetCount ?? ''));

  const save = async (updated: { id: string; name: string }[]) => {
    const parsedCount = parseInt(targetCount, 10);
    await updateElement(elementId, {
      config: {
        ...config,
        options: updated,
        targetOption: type === 'single_select' ? (targetOption.trim() || undefined) : undefined,
        targetCount: type === 'multi_select' && targetCount.trim() && !isNaN(parsedCount) ? parsedCount : undefined,
      },
    });
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

  const handleTargetBlur = () => save(options);

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
      {type === 'single_select' && (
        <Input
          label="Target option (optional)"
          value={targetOption}
          onChangeText={setTargetOption}
          onBlur={handleTargetBlur}
          placeholder="e.g. Option 1"
        />
      )}
      {type === 'multi_select' && (
        <Input
          label="Target number selected (optional)"
          value={targetCount}
          onChangeText={setTargetCount}
          onBlur={handleTargetBlur}
          keyboardType="number-pad"
        />
      )}
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
