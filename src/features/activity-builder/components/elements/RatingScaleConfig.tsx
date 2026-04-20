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

export function RatingScaleConfig({ elementId, config, onConfigChange }: Props) {
  const [maxValue, setMaxValue] = useState(String(config.maxValue ?? 5));
  const [lowLabel, setLowLabel] = useState(String(config.lowLabel ?? ''));
  const [highLabel, setHighLabel] = useState(String(config.highLabel ?? ''));

  const handleSave = async () => {
    const max = parseInt(maxValue, 10);
    if (isNaN(max) || max < 3 || max > 10) return;
    await updateElement(elementId, {
      config: { ...config, minValue: 1, maxValue: max, lowLabel: lowLabel.trim() || undefined, highLabel: highLabel.trim() || undefined },
    });
    onConfigChange();
  };

  return (
    <View style={styles.container}>
      <Input label="Max value (3–10)" value={maxValue} onChangeText={setMaxValue} onBlur={handleSave} keyboardType="number-pad" required />
      <Input label="Low end label (optional)" value={lowLabel} onChangeText={setLowLabel} onBlur={handleSave} placeholder="e.g. Poor" />
      <Input label="High end label (optional)" value={highLabel} onChangeText={setHighLabel} onBlur={handleSave} placeholder="e.g. Excellent" />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
