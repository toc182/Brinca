import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

type TargetAnswer = 'yes' | 'no' | null;

export function YesNoAddConfig({ value, onChange }: Props) {
  const raw = value.targetAnswer;
  const targetAnswer: TargetAnswer = raw === 'yes' ? 'yes' : raw === 'no' ? 'no' : null;

  const handleSelect = (next: 'yes' | 'no') => {
    const newTarget: TargetAnswer = targetAnswer === next ? null : next;
    onChange({ ...value, targetAnswer: newTarget ?? undefined });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Target answer (optional)</Text>
      <View style={styles.row}>
        {(['yes', 'no'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => handleSelect(option)}
            style={[styles.chip, targetAnswer === option && styles.chipSelected]}
          >
            <Text style={[styles.chipText, targetAnswer === option && styles.chipTextSelected]}>
              {option === 'yes' ? 'Yes' : 'No'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textPrimary },
  row: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  chipSelected: { backgroundColor: colors.primary50, borderColor: colors.primary500 },
  chipText: { ...typography.buttonSmall, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary700 },
});
