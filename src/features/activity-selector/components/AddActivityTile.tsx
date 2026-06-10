import { Plus } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

export function AddActivityTile() {
  return (
    <Pressable
      style={styles.tile}
      disabled
      accessibilityRole="button"
      accessibilityLabel="Add activity"
      accessibilityState={{ disabled: true }}
    >
      <View style={styles.content}>
        <Plus size={24} color={colors.primary500} weight="regular" />
        <Text style={styles.label}>Add activity</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.primary50,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_600SemiBold',
    color: colors.primary500,
  },
});
