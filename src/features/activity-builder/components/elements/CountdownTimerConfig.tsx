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

export function CountdownTimerConfig({ elementId, drillId, config }: Props) {
  const updateMutation = useUpdateElementMutation();
  const [seconds, setSeconds] = useState(String(config.durationSeconds ?? 60));

  const handleSave = async () => {
    const parsed = parseInt(seconds, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    await updateMutation.mutateAsync({
      elementId,
      drillId,
      fields: { config: { ...config, durationSeconds: parsed } },
    });
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
