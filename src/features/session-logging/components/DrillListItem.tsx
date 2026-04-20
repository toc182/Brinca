import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, shadows } from '@/shared/theme';

interface DrillListItemProps {
  name: string;
  isComplete: boolean;
  onPress: () => void;
}

export function DrillListItem({ name, isComplete, onPress }: DrillListItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.indicator, isComplete && styles.indicatorComplete]} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.borderDefault,
    marginRight: spacing.sm,
  },
  indicatorComplete: {
    backgroundColor: colors.success500,
    borderColor: colors.success500,
  },
  name: { ...typography.titleSmall, color: colors.textPrimary, flex: 1 },
  chevron: { ...typography.titleMedium, color: colors.textSecondary },
});
