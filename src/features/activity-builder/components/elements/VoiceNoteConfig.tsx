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

export function VoiceNoteConfig({ elementId, config, onConfigChange }: Props) {
  const [maxDuration, setMaxDuration] = useState(String(config.maxDurationSeconds ?? 180));

  const handleSave = async () => {
    const parsed = parseInt(maxDuration, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    await updateElement(elementId, { config: { ...config, maxDurationSeconds: parsed } });
    onConfigChange();
  };

  return (
    <Input
      label="Max recording duration (seconds)"
      value={maxDuration}
      onChangeText={setMaxDuration}
      onBlur={handleSave}
      keyboardType="number-pad"
      required
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({ input: { marginTop: spacing.xs } });
