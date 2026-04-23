import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

export function MultistepCounterConfig({ elementId, config, onConfigChange }: Props) {
  const [substeps, setSubsteps] = useState<string[]>(
    Array.isArray(config.substeps) ? (config.substeps as string[]) : ['Step 1']
  );
  const [targetReps, setTargetReps] = useState(String(config.targetReps ?? ''));

  const save = async (updated: string[]) => {
    const parsed = parseInt(targetReps, 10);
    await updateElement(elementId, {
      config: { ...config, substeps: updated, targetReps: targetReps.trim() && !isNaN(parsed) ? parsed : undefined },
    });
    onConfigChange();
  };

  const addSubstep = () => {
    const updated = [...substeps, `Step ${substeps.length + 1}`];
    setSubsteps(updated);
    save(updated);
  };

  const removeSubstep = (index: number) => {
    if (substeps.length <= 1) return;
    const updated = substeps.filter((_, i) => i !== index);
    setSubsteps(updated);
    save(updated);
  };

  const updateSubstep = (index: number, value: string) => {
    const updated = [...substeps];
    updated[index] = value;
    setSubsteps(updated);
  };

  const handleTargetRepsBlur = () => save(substeps);

  return (
    <View style={styles.container}>
      {substeps.map((step, i) => (
        <View key={i} style={styles.row}>
          <Input
            label={`Substep ${i + 1}`}
            value={step}
            onChangeText={(v) => updateSubstep(i, v)}
            onBlur={() => save(substeps)}
            style={styles.input}
          />
          {substeps.length > 1 && (
            <Pressable onPress={() => removeSubstep(i)} style={styles.removeButton}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Button title="Add substep" onPress={addSubstep} variant="text" size="small" />
      <Input label="Target reps (optional)" value={targetReps} onChangeText={setTargetReps} onBlur={handleTargetRepsBlur} keyboardType="number-pad" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xs, gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  input: { flex: 1 },
  removeButton: {
    width: 32, height: 32, borderRadius: radii.full,
    backgroundColor: colors.error50, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  removeText: { color: colors.error600, fontWeight: '700', fontSize: 14 },
});
