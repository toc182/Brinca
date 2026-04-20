import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

export function NumberInputConfig({ elementId, config, onConfigChange }: Props) {
  const [unit, setUnit] = useState(String(config.unit ?? ''));
  const [target, setTarget] = useState(String(config.targetValue ?? ''));

  const handleSave = async () => {
    const targetValue = target.trim() ? parseFloat(target) : undefined;
    await updateElement(elementId, {
      config: { ...config, unit: unit.trim() || undefined, targetValue: isNaN(targetValue as number) ? undefined : targetValue },
    });
    onConfigChange();
  };

  return (
    <View style={styles.container}>
      <Input label="Unit (optional)" value={unit} onChangeText={setUnit} onBlur={handleSave} placeholder="e.g. lbs, seconds, cm" />
      <Input label="Target value (optional)" value={target} onChangeText={setTarget} onBlur={handleSave} keyboardType="decimal-pad" />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
