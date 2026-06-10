import { useState } from 'react';

import { Input } from '@/shared/components/Input';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function LapTimerAddConfig({ value, onChange }: Props) {
  const [targetLaps, setTargetLaps] = useState(value.targetLaps != null ? String(value.targetLaps) : '');

  const handleChange = (text: string) => {
    setTargetLaps(text);
    const parsed = text.trim() ? parseInt(text, 10) : NaN;
    onChange({ ...value, targetLaps: isNaN(parsed) ? undefined : parsed });
  };

  return (
    <Input
      label="Target laps (optional)"
      value={targetLaps}
      onChangeText={handleChange}
      keyboardType="number-pad"
      placeholder="e.g. 10"
    />
  );
}
