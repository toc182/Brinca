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

export function ChecklistConfig({ elementId, config, onConfigChange }: Props) {
  const [items, setItems] = useState<{ id: string; name: string }[]>(
    Array.isArray(config.items) ? (config.items as { id: string; name: string }[]) : [{ id: '1', name: 'Item 1' }]
  );

  const save = async (updated: { id: string; name: string }[]) => {
    await updateElement(elementId, { config: { ...config, items: updated } });
    onConfigChange();
  };

  const addItem = () => {
    const updated = [...items, { id: randomUUID(), name: `Item ${items.length + 1}` }];
    setItems(updated);
    save(updated);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    save(updated);
  };

  const updateItem = (index: number, name: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], name };
    setItems(updated);
  };

  return (
    <View style={styles.container}>
      {items.map((item, i) => (
        <View key={item.id} style={styles.row}>
          <Input label={`Item ${i + 1}`} value={item.name} onChangeText={(v) => updateItem(i, v)} onBlur={() => save(items)} style={styles.input} />
          {items.length > 1 && (
            <Pressable onPress={() => removeItem(i)} style={styles.removeButton}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Button title="Add item" onPress={addItem} variant="text" size="small" />
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
