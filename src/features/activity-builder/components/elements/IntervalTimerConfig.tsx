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

export function IntervalTimerConfig({ elementId, config, onConfigChange }: Props) {
  const [work, setWork] = useState(String(config.workDurationSeconds ?? 30));
  const [rest, setRest] = useState(String(config.restDurationSeconds ?? 15));
  const [cycles, setCycles] = useState(String(config.cycles ?? 5));

  const handleSave = async () => {
    const w = parseInt(work, 10);
    const r = parseInt(rest, 10);
    const c = parseInt(cycles, 10);
    if ([w, r, c].some((v) => isNaN(v) || v <= 0)) return;
    await updateElement(elementId, {
      config: { ...config, workDurationSeconds: w, restDurationSeconds: r, cycles: c },
    });
    onConfigChange();
  };

  return (
    <View style={styles.container}>
      <Input label="Work (seconds)" value={work} onChangeText={setWork} onBlur={handleSave} keyboardType="number-pad" required />
      <Input label="Rest (seconds)" value={rest} onChangeText={setRest} onBlur={handleSave} keyboardType="number-pad" required />
      <Input label="Cycles" value={cycles} onChangeText={setCycles} onBlur={handleSave} keyboardType="number-pad" required />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
