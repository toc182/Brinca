import { useState } from 'react';

import { Input } from '@/shared/components/Input';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function CounterAddConfig({ value, onChange }: Props) {
  const [target, setTarget] = useState(value.target != null ? String(value.target) : '');

  const handleChange = (text: string) => {
    setTarget(text);
    const parsed = text.trim() ? parseInt(text, 10) : NaN;
    onChange({ ...value, target: isNaN(parsed) ? undefined : parsed });
  };

  return (
    <Input
      label="Target value (optional)"
      value={target}
      onChangeText={handleChange}
      keyboardType="number-pad"
      placeholder="e.g. 100"
    />
  );
}
