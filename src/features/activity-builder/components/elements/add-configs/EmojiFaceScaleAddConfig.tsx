import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

interface Props {
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function EmojiFaceScaleAddConfig({ value, onChange }: Props) {
  const faceCount: 3 | 5 = value.faceCount === 3 ? 3 : 5;
  const targetFace = typeof value.targetFace === 'number' ? value.targetFace : null;

  const handleFaceCount = (count: 3 | 5) => {
    // Drop target if it now exceeds the new max.
    const newTarget = targetFace !== null && targetFace > count ? null : targetFace;
    onChange({ ...value, faceCount: count, targetFace: newTarget ?? undefined });
  };

  const handleTargetFace = (index: number) => {
    const newTarget = targetFace === index ? null : index;
    onChange({ ...value, targetFace: newTarget ?? undefined });
  };

  const faceIndices = Array.from({ length: faceCount }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Number of faces</Text>
      <View style={styles.row}>
        {([3, 5] as const).map((count) => (
          <Pressable
            key={count}
            onPress={() => handleFaceCount(count)}
            style={[styles.chip, faceCount === count && styles.chipSelected]}
          >
            <Text style={[styles.chipText, faceCount === count && styles.chipTextSelected]}>
              {count} faces
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Target face (optional)</Text>
      <View style={styles.row}>
        {faceIndices.map((index) => (
          <Pressable
            key={index}
            onPress={() => handleTargetFace(index)}
            style={[styles.chip, targetFace === index && styles.chipSelected]}
          >
            <Text style={[styles.chipText, targetFace === index && styles.chipTextSelected]}>
              {index}
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
  row: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
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
