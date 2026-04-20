import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { AccoladeDefinition } from '@/shared/gamification/accolade-catalog';

export function AccoladeUnlockDisplay({ accolade }: { accolade: AccoladeDefinition }) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{accolade.name}</Text>
      <Text style={styles.description}>{accolade.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent50,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  name: { ...typography.titleSmall, color: colors.accent600 },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});
