import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';
import { useUpdateElementMutation } from '../../mutations/useUpdateElementMutation';

interface Props {
  elementId: string;
  drillId: string;
  config: Record<string, unknown>;
}

export function LapTimerConfig({ elementId, drillId, config }: Props) {
  const updateMutation = useUpdateElementMutation();
  const [targetLaps, setTargetLaps] = useState(String(config.targetLaps ?? ''));

  const handleSave = async () => {
    const parsed = parseInt(targetLaps, 10);
    await updateMutation.mutateAsync({
      elementId,
      drillId,
      fields: { config: { ...config, targetLaps: targetLaps.trim() && !isNaN(parsed) ? parsed : undefined } },
    });
  };

  return (
    <View style={styles.container}>
      <Input
        label="Target laps (optional)"
        value={targetLaps}
        onChangeText={setTargetLaps}
        onBlur={handleSave}
        keyboardType="number-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
