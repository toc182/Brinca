import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Input } from '@/shared/components/Input';
import { colors, spacing, typography } from '@/shared/theme';
import { ELEMENT_LABELS, type ElementType } from '@/shared/tracking-elements/types/element-types';

import { useUpdateElementMutation } from '../../mutations/useUpdateElementMutation';

interface Props {
  elementId: string;
  drillId: string;
  initialLabel: string;
  type: ElementType;
}

export function ElementLabelInput({ elementId, drillId, initialLabel, type }: Props) {
  const [label, setLabel] = useState(initialLabel);
  const updateMutation = useUpdateElementMutation();
  const labelRef = useRef(label);
  labelRef.current = label;

  const flushSave = () => {
    const trimmed = labelRef.current.trim();
    if (!trimmed || trimmed === initialLabel) return;
    updateMutation.mutate({ elementId, drillId, fields: { label: trimmed } });
  };

  useEffect(() => {
    return flushSave;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Input
        label="Name"
        value={label}
        onChangeText={setLabel}
        onBlur={flushSave}
        inBottomSheet
        maxLength={60}
        required
      />
      <Text style={styles.typeLabel}>{ELEMENT_LABELS[type]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  typeLabel: { ...typography.caption, color: colors.textSecondary },
});
