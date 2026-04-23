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

export function SplitCounterConfig({ elementId, config, onConfigChange }: Props) {
  const [leftLabel, setLeftLabel] = useState(String(config.leftLabel ?? 'Left'));
  const [rightLabel, setRightLabel] = useState(String(config.rightLabel ?? 'Right'));
  const [leftTarget, setLeftTarget] = useState(String(config.leftTarget ?? ''));
  const [rightTarget, setRightTarget] = useState(String(config.rightTarget ?? ''));

  const handleSave = async () => {
    const parsedLeft = parseInt(leftTarget, 10);
    const parsedRight = parseInt(rightTarget, 10);
    await updateElement(elementId, {
      config: {
        ...config,
        leftLabel: leftLabel.trim() || 'Left',
        rightLabel: rightLabel.trim() || 'Right',
        leftTarget: leftTarget.trim() && !isNaN(parsedLeft) ? parsedLeft : undefined,
        rightTarget: rightTarget.trim() && !isNaN(parsedRight) ? parsedRight : undefined,
      },
    });
    onConfigChange();
  };

  return (
    <View style={styles.container}>
      <Input label="Left label" value={leftLabel} onChangeText={setLeftLabel} onBlur={handleSave} required />
      <Input label="Right label" value={rightLabel} onChangeText={setRightLabel} onBlur={handleSave} required />
      <Input label="Left target (optional)" value={leftTarget} onChangeText={setLeftTarget} onBlur={handleSave} keyboardType="number-pad" />
      <Input label="Right target (optional)" value={rightTarget} onChangeText={setRightTarget} onBlur={handleSave} keyboardType="number-pad" />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
