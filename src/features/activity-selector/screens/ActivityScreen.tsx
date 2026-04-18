import { StyleSheet, Text, View } from 'react-native';

import { colors, typography, spacing } from '@/shared/theme';

export function ActivityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.subtitle}>Session logging coming in Phase 6</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
