import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  type: ElementType;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

export function NumberInputConfig({ elementId, type, config, onConfigChange }: Props) {
  const [unit, setUnit] = useState(String(config.unit ?? ''));
  const [target, setTarget] = useState(String(config.targetValue ?? ''));
  const [targetEntries, setTargetEntries] = useState(String(config.targetEntries ?? ''));

  const handleSave = async () => {
    const targetValue = target.trim() ? parseFloat(target) : undefined;
    const parsedEntries = parseInt(targetEntries, 10);
    await updateElement(elementId, {
      config: {
        ...config,
        unit: unit.trim() || undefined,
        targetValue: isNaN(targetValue as number) ? undefined : targetValue,
        targetEntries: type === 'multi_number_input' && targetEntries.trim() && !isNaN(parsedEntries) ? parsedEntries : undefined,
      },
    });
    onConfigChange();
  };

  return (
    <View style={styles.container}>
      <Input label="Unit (optional)" value={unit} onChangeText={setUnit} onBlur={handleSave} placeholder="e.g. lbs, seconds, cm" />
      <Input label="Target value (optional)" value={target} onChangeText={setTarget} onBlur={handleSave} keyboardType="decimal-pad" />
      {type === 'multi_number_input' && (
        <Input label="Target entries (optional)" value={targetEntries} onChangeText={setTargetEntries} onBlur={handleSave} keyboardType="number-pad" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
