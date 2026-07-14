import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Input } from '@/shared/components/Input';
import { spacing } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function SplitCounterAddConfig({ value, onChange }: Props) {
  const [leftLabel, setLeftLabel] = useState(String(value.leftLabel ?? 'Left'));
  const [rightLabel, setRightLabel] = useState(String(value.rightLabel ?? 'Right'));
  const [leftTarget, setLeftTarget] = useState(value.leftTarget != null ? String(value.leftTarget) : '');
  const [rightTarget, setRightTarget] = useState(value.rightTarget != null ? String(value.rightTarget) : '');

  const emit = (next: { leftLabel?: string; rightLabel?: string; leftTarget?: string; rightTarget?: string }) => {
    const lLabel = (next.leftLabel ?? leftLabel).trim() || 'Left';
    const rLabel = (next.rightLabel ?? rightLabel).trim() || 'Right';
    const lTargetRaw = next.leftTarget ?? leftTarget;
    const rTargetRaw = next.rightTarget ?? rightTarget;
    const lTarget = lTargetRaw.trim() ? parseInt(lTargetRaw, 10) : NaN;
    const rTarget = rTargetRaw.trim() ? parseInt(rTargetRaw, 10) : NaN;

    onChange({
      ...value,
      leftLabel: lLabel,
      rightLabel: rLabel,
      leftTarget: isNaN(lTarget) ? undefined : lTarget,
      rightTarget: isNaN(rTarget) ? undefined : rTarget,
    });
  };

  return (
    <View style={styles.container}>
      {/* Left/right paired side by side so the modal stays short. */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Input
            label="Left label"
            value={leftLabel}
            onChangeText={(v) => { setLeftLabel(v); emit({ leftLabel: v }); }}
            required
          />
        </View>
        <View style={styles.col}>
          <Input
            label="Right label"
            value={rightLabel}
            onChangeText={(v) => { setRightLabel(v); emit({ rightLabel: v }); }}
            required
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.col}>
          <Input
            label="Left target"
            value={leftTarget}
            onChangeText={(v) => { setLeftTarget(v); emit({ leftTarget: v }); }}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.col}>
          <Input
            label="Right target"
            value={rightTarget}
            onChangeText={(v) => { setRightTarget(v); emit({ rightTarget: v }); }}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },
});
