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

export function CountdownTimerConfig({ elementId, config, onConfigChange }: Props) {
  const [seconds, setSeconds] = useState(String(config.durationSeconds ?? 60));

  const handleSave = async () => {
    const parsed = parseInt(seconds, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    await updateElement(elementId, { config: { ...config, durationSeconds: parsed } });
    onConfigChange();
  };

  return (
    <Input
      label="Duration (seconds)"
      value={seconds}
      onChangeText={setSeconds}
      onBlur={handleSave}
      keyboardType="number-pad"
      required
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({ input: { marginTop: spacing.xs } });
