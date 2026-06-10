import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

/**
 * Permanent, non-removable card shown at the top of the drill builder's
 * tracking section. Communicates that every drill can be marked complete on
 * its own — tracking elements are optional extras layered on top.
 *
 * This is purely presentational. The behavior it describes is inherent: a
 * drill with zero tracking elements already surfaces a "Mark complete" action
 * in a live session (see session-logging DrillScreen + useMarkDrillCompleteMutation).
 */
export function MarkCompleteDefaultCard() {
  return (
    <View style={styles.card}>
      <View style={styles.checkBadge}>
        <Text style={styles.checkGlyph}>✓</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Mark as complete</Text>
        <Text style={styles.subtitle}>Built in — every drill can be finished on its own, with nothing to track.</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>DEFAULT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success50,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  body: { flex: 1 },
  title: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  pill: {
    backgroundColor: colors.success500,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  pillText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
