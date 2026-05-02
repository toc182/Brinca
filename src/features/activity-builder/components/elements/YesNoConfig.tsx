import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { useUpdateElementMutation } from '../../mutations/useUpdateElementMutation';

interface Props {
  elementId: string;
  drillId: string;
  config: Record<string, unknown>;
}

type TargetAnswer = 'yes' | 'no' | null;

export function YesNoConfig({ elementId, drillId, config }: Props) {
  const updateMutation = useUpdateElementMutation();
  const rawTarget = config.targetAnswer;
  const targetAnswer: TargetAnswer =
    rawTarget === 'yes' ? 'yes' : rawTarget === 'no' ? 'no' : null;

  const handleSelect = async (value: 'yes' | 'no') => {
    const newTarget: TargetAnswer = targetAnswer === value ? null : value;
    await updateMutation.mutateAsync({
      elementId,
      drillId,
      fields: { config: { ...config, targetAnswer: newTarget ?? undefined } },
    });
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
  container: { marginTop: spacing.xs },
  label: { ...typography.caption, color: colors.textPrimary, marginBottom: spacing.xs },
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
