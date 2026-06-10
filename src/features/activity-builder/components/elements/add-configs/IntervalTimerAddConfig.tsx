import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function IntervalTimerAddConfig({ value, onChange }: Props) {
  const initialWork = typeof value.workDurationSeconds === 'number' ? value.workDurationSeconds : 30;
  const initialRest = typeof value.restDurationSeconds === 'number' ? value.restDurationSeconds : 15;
  const initialCycles = typeof value.cycles === 'number' ? value.cycles : 5;

  const [work, setWork] = useState(String(initialWork));
  const [rest, setRest] = useState(String(initialRest));
  const [cycles, setCycles] = useState(String(initialCycles));

  const emitIfValid = (next: { work?: string; rest?: string; cycles?: string }) => {
    const w = parseInt(next.work ?? work, 10);
    const r = parseInt(next.rest ?? rest, 10);
    const c = parseInt(next.cycles ?? cycles, 10);
    if ([w, r, c].some((v) => isNaN(v) || v <= 0)) return;
    onChange({ ...value, workDurationSeconds: w, restDurationSeconds: r, cycles: c });
  };

  return (
    <View style={styles.container}>
      <Input
        label="Work (seconds)"
        value={work}
        onChangeText={(v) => { setWork(v); emitIfValid({ work: v }); }}
        keyboardType="number-pad"
        required
      />
      <Input
        label="Rest (seconds)"
        value={rest}
        onChangeText={(v) => { setRest(v); emitIfValid({ rest: v }); }}
        keyboardType="number-pad"
        required
      />
      <Input
        label="Cycles"
        value={cycles}
        onChangeText={(v) => { setCycles(v); emitIfValid({ cycles: v }); }}
        keyboardType="number-pad"
        required
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
});
