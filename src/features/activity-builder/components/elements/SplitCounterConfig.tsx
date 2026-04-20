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

  const handleSave = async () => {
    await updateElement(elementId, {
      config: { ...config, leftLabel: leftLabel.trim() || 'Left', rightLabel: rightLabel.trim() || 'Right' },
    });
    onConfigChange();
  };

  return (
    <View style={styles.container}>
      <Input label="Left label" value={leftLabel} onChangeText={setLeftLabel} onBlur={handleSave} required />
      <Input label="Right label" value={rightLabel} onChangeText={setRightLabel} onBlur={handleSave} required />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs, marginTop: spacing.xs } });
