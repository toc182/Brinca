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

interface Item {
  id: string;
  name: string;
}

export function ChecklistAddConfig({ value, onChange }: Props) {
  const [items, setItems] = useState<Item[]>(
    Array.isArray(value.items) && (value.items as Item[]).length > 0
      ? (value.items as Item[])
      : [{ id: '1', name: 'Item 1' }],
  );
  const [targetItems, setTargetItems] = useState(value.targetItems != null ? String(value.targetItems) : '');

  const emit = (nextItems: Item[], nextTargetRaw: string) => {
    const cleaned = nextItems.map((it, i) => ({ ...it, name: it.name.trim() || `Item ${i + 1}` }));
    const parsed = nextTargetRaw.trim() ? parseInt(nextTargetRaw, 10) : NaN;
    onChange({
      ...value,
      items: cleaned,
      targetItems: isNaN(parsed) ? undefined : parsed,
    });
  };

  const updateItem = (index: number, name: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], name };
    setItems(updated);
    emit(updated, targetItems);
  };

  const addItem = () => {
    const updated = [...items, { id: randomUUID(), name: `Item ${items.length + 1}` }];
    setItems(updated);
    emit(updated, targetItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    emit(updated, targetItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setItems(updated);
    emit(updated, targetItems);
  };

  const handleTargetChange = (text: string) => {
    setTargetItems(text);
    emit(items, text);
  };

  return (
    <View style={styles.container}>
      <Input
        label="Target items completed (optional)"
        value={targetItems}
        onChangeText={handleTargetChange}
        keyboardType="number-pad"
      />
      {items.map((item, i) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.reorderButtons}>
            <Pressable onPress={() => moveItem(i, 'up')} disabled={i === 0} style={styles.reorderButton}>
              <Text style={[styles.reorderText, i === 0 && styles.reorderTextDisabled]}>{'▲'}</Text>
            </Pressable>
            <Pressable onPress={() => moveItem(i, 'down')} disabled={i === items.length - 1} style={styles.reorderButton}>
              <Text style={[styles.reorderText, i === items.length - 1 && styles.reorderTextDisabled]}>{'▼'}</Text>
            </Pressable>
          </View>
          <Input
            label={`Item ${i + 1}`}
            value={item.name}
            onChangeText={(v) => updateItem(i, v)}
            style={styles.input}
          />
          {items.length > 1 && (
            <Pressable onPress={() => removeItem(i)} style={styles.removeButton}>
              <Text style={styles.removeText}>{'✕'}</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Button title="Add item" onPress={addItem} variant="text" size="small" />
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
  reorderButtons: { flexDirection: 'column', gap: 2, marginBottom: 24 },
  reorderButton: { width: 24, height: 14, alignItems: 'center', justifyContent: 'center' },
  reorderText: { fontSize: 10, color: colors.textSecondary },
  reorderTextDisabled: { color: colors.borderDefault },
});
