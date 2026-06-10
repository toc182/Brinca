import { useState } from 'react';

import { Input } from '@/shared/components/Input';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function CountdownTimerAddConfig({ value, onChange }: Props) {
  const initial = typeof value.durationSeconds === 'number' ? value.durationSeconds : 60;
  const [seconds, setSeconds] = useState(String(initial));

  const handleChange = (text: string) => {
    setSeconds(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange({ ...value, durationSeconds: parsed });
    }
  };

  return (
    <Input
      label="Duration (seconds)"
      value={seconds}
      onChangeText={handleChange}
      keyboardType="number-pad"
      required
    />
  );
}
