import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, radii, spacing } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function MultistepCounterAddConfig({ value, onChange }: Props) {
  const [substeps, setSubsteps] = useState<string[]>(
    Array.isArray(value.substeps) && (value.substeps as string[]).length > 0
      ? (value.substeps as string[])
      : ['Step 1'],
  );
  const [targetReps, setTargetReps] = useState(value.targetReps != null ? String(value.targetReps) : '');

  const emit = (nextSubsteps: string[], nextTargetRepsRaw: string) => {
    const cleanedSubsteps = nextSubsteps.map((s, i) => s.trim() || `Step ${i + 1}`);
    const parsed = nextTargetRepsRaw.trim() ? parseInt(nextTargetRepsRaw, 10) : NaN;
    onChange({
      ...value,
      substeps: cleanedSubsteps,
      targetReps: isNaN(parsed) ? undefined : parsed,
    });
  };

  const updateSubstep = (index: number, text: string) => {
    const updated = [...substeps];
    updated[index] = text;
    setSubsteps(updated);
    emit(updated, targetReps);
  };

  const addSubstep = () => {
    const updated = [...substeps, `Step ${substeps.length + 1}`];
    setSubsteps(updated);
    emit(updated, targetReps);
  };

  const removeSubstep = (index: number) => {
    if (substeps.length <= 1) return;
    const updated = substeps.filter((_, i) => i !== index);
    setSubsteps(updated);
    emit(updated, targetReps);
  };

  const handleTargetRepsChange = (text: string) => {
    setTargetReps(text);
    emit(substeps, text);
  };

  return (
    <View style={styles.container}>
      {substeps.map((step, i) => (
        <View key={i} style={styles.row}>
          <Input
            label={`Substep ${i + 1}`}
            value={step}
            onChangeText={(v) => updateSubstep(i, v)}
            style={styles.input}
          />
          {substeps.length > 1 && (
            <Pressable onPress={() => removeSubstep(i)} style={styles.removeButton}>
              <Text style={styles.removeText}>{'✕'}</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Button title="Add substep" onPress={addSubstep} variant="text" size="small" />
      <Input
        label="Target reps (optional)"
        value={targetReps}
        onChangeText={handleTargetRepsChange}
        keyboardType="number-pad"
      />
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
  removeText: {
    color: colors.error600,
    fontWeight: '700',
    fontSize: 14,
  },
});
