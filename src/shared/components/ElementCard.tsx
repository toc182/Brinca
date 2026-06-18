import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/shared/theme';

interface ElementCardProps {
  /** Centered label shown above the element (the element's name). */
  label: string;
  /** The element itself (interactive in a session, static in a preview). */
  children: ReactNode;
  /** Shows the green target-met check in the corner. */
  targetMet?: boolean;
  /** Extra container style — e.g. the full/half flex basis from the layout. */
  style?: StyleProp<ViewStyle>;
}

/**
 * The contained presentation of a tracking element: a surface card with a
 * centered label and an optional target-met badge. Shared by the live session
 * and the builder's configure-modal preview so a counter (or any element)
 * looks identical everywhere.
 */
export function ElementCard({ label, children, targetMet = false, style }: ElementCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {targetMet && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    minWidth: 0,
    ...shadows.sm,
  },
  header: { marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.titleSmall, color: colors.textPrimary, textAlign: 'center' },
  badge: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -11 }],
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.success500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
