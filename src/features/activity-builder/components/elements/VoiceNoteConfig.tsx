import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';
import { useUpdateElementMutation } from '../../mutations/useUpdateElementMutation';

interface Props {
  elementId: string;
  drillId: string;
  config: Record<string, unknown>;
}

export function VoiceNoteConfig({ elementId, drillId, config }: Props) {
  const updateMutation = useUpdateElementMutation();
  const [maxDuration, setMaxDuration] = useState(String(config.maxDurationSeconds ?? 180));

  const handleSave = async () => {
    const parsed = parseInt(maxDuration, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    await updateMutation.mutateAsync({
      elementId,
      drillId,
      fields: { config: { ...config, maxDurationSeconds: parsed } },
    });
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
