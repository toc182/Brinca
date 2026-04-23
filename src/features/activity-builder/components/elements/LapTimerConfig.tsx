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

export function LapTimerConfig({ elementId, config, onConfigChange }: Props) {
  const [targetLaps, setTargetLaps] = useState(String(config.targetLaps ?? ''));

  const handleSave = async () => {
    const parsed = parseInt(targetLaps, 10);
    await updateElement(elementId, {
      config: { ...config, targetLaps: targetLaps.trim() && !isNaN(parsed) ? parsed : undefined },
    });
    onConfigChange();
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
