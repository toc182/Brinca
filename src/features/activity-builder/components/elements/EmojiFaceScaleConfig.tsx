import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { updateElement } from '../../repositories/tracking-element.repository';

interface Props {
  elementId: string;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

export function EmojiFaceScaleConfig({ elementId, config, onConfigChange }: Props) {
  const faceCount = config.faceCount === 3 ? 3 : 5;
  const targetFace = typeof config.targetFace === 'number' ? config.targetFace : null;

  const handleToggle = async (count: 3 | 5) => {
    const newTarget = targetFace !== null && targetFace > count ? null : targetFace;
    await updateElement(elementId, { config: { ...config, faceCount: count, targetFace: newTarget ?? undefined } });
    onConfigChange();
  };

  const handleTargetFace = async (index: number) => {
    const newTarget = targetFace === index ? null : index;
    await updateElement(elementId, { config: { ...config, targetFace: newTarget ?? undefined } });
    onConfigChange();
  };

  const faceIndices = Array.from({ length: faceCount }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Number of faces</Text>
      <View style={styles.row}>
        {([3, 5] as const).map((count) => (
          <Pressable
            key={count}
            onPress={() => handleToggle(count)}
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
  container: { marginTop: spacing.xs },
  label: { ...typography.caption, color: colors.textPrimary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full, borderWidth: 1, borderColor: colors.borderDefault },
  chipSelected: { backgroundColor: colors.primary50, borderColor: colors.primary500 },
  chipText: { ...typography.buttonSmall, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary700 },
});
