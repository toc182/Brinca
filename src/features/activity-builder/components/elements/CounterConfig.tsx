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

export function CounterConfig({ elementId, drillId, config }: Props) {
  const updateMutation = useUpdateElementMutation();
  const [target, setTarget] = useState(String(config.target ?? ''));

  const handleSave = async () => {
    const parsed = target.trim() ? parseInt(target, 10) : undefined;
    await updateMutation.mutateAsync({
      elementId,
      drillId,
      fields: { config: { ...config, target: isNaN(parsed as number) ? undefined : parsed } },
    });
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
