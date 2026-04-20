import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

export function CounterConfig({ elementId, config, onConfigChange }: Props) {
  const [target, setTarget] = useState(String(config.target ?? ''));

  const handleSave = async () => {
    const parsed = target.trim() ? parseInt(target, 10) : undefined;
    await updateElement(elementId, {
      config: { ...config, target: isNaN(parsed as number) ? undefined : parsed },
    });
    onConfigChange();
  };

  return (
    <Input
      label="Target value (optional)"
      value={target}
      onChangeText={setTarget}
      onBlur={handleSave}
      keyboardType="number-pad"
      placeholder="e.g. 100"
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({ input: { marginTop: spacing.xs } });
