import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function RatingScaleAddConfig({ value, onChange }: Props) {
  const [minValue, setMinValue] = useState(String(value.minValue ?? 1));
  const [maxValue, setMaxValue] = useState(String(value.maxValue ?? 5));
  const [lowLabel, setLowLabel] = useState(String(value.lowLabel ?? ''));
  const [highLabel, setHighLabel] = useState(String(value.highLabel ?? ''));
  const [targetValue, setTargetValue] = useState(value.targetValue != null ? String(value.targetValue) : '');

  const emit = (next: {
    minValue?: string;
    maxValue?: string;
    lowLabel?: string;
    highLabel?: string;
    targetValue?: string;
  }) => {
    const min = parseInt(next.minValue ?? minValue, 10);
    const max = parseInt(next.maxValue ?? maxValue, 10);
    // Only emit when min/max satisfy edit-config validation (min < max, max in 3..10).
    if (isNaN(min) || isNaN(max) || min >= max || max < 3 || max > 10) return;

    const targetRaw = next.targetValue ?? targetValue;
    const parsedTarget = targetRaw.trim() ? parseInt(targetRaw, 10) : NaN;

    onChange({
      ...value,
      minValue: min,
      maxValue: max,
      lowLabel: (next.lowLabel ?? lowLabel).trim() || undefined,
      highLabel: (next.highLabel ?? highLabel).trim() || undefined,
      targetValue: isNaN(parsedTarget) ? undefined : parsedTarget,
    });
  };

  return (
    <View style={styles.container}>
      <Input
        label="Min value (default 1)"
        value={minValue}
        onChangeText={(v) => { setMinValue(v); emit({ minValue: v }); }}
        keyboardType="number-pad"
      />
      <Input
        label="Max value (3–10)"
        value={maxValue}
        onChangeText={(v) => { setMaxValue(v); emit({ maxValue: v }); }}
        keyboardType="number-pad"
        required
      />
      <Input
        label="Low end label (optional)"
        value={lowLabel}
        onChangeText={(v) => { setLowLabel(v); emit({ lowLabel: v }); }}
        placeholder="e.g. Poor"
      />
      <Input
        label="High end label (optional)"
        value={highLabel}
        onChangeText={(v) => { setHighLabel(v); emit({ highLabel: v }); }}
        placeholder="e.g. Excellent"
      />
      <Input
        label="Target value (optional)"
        value={targetValue}
        onChangeText={(v) => { setTargetValue(v); emit({ targetValue: v }); }}
        keyboardType="number-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
});
