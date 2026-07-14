import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { TargetMetRibbon } from './TargetMetRibbon';

interface ElementCardProps {
  /** Centered label shown above the element (the element's name). */
  label: string;
  /** The element itself (interactive in a session, static in a preview). */
  children: ReactNode;
  /** Shows the green target-met check in the corner. */
  targetMet?: boolean;
  /** Extra container style — e.g. the full/half flex basis from the layout. */
  style?: StyleProp<ViewStyle>;
  /**
   * When provided, the whole card becomes one tap target (used by the tap
   * counter, which has no inner buttons). Omitted for normal elements, which
   * keep their own internal controls and render an inert View.
   */
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  /** Accessibility label for the pressable card (only used with onPress). */
  pressAccessibilityLabel?: string;
}

/**
 * The contained presentation of a tracking element: a surface card with a
 * centered label and an optional target-met badge. Shared by the live session
 * and the builder's configure-modal preview so a counter (or any element)
 * looks identical everywhere. Pass onPress to make the entire card the tap
 * target (tap counter); otherwise it is a plain View.
 */
export function ElementCard({
  label,
  children,
  targetMet = false,
  style,
  onPress,
  onLongPress,
  delayLongPress,
  pressAccessibilityLabel,
}: ElementCardProps) {
  const inner = (
    <>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
      {children}
      <TargetMetRibbon met={targetMet} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        accessibilityRole="button"
        accessibilityLabel={pressAccessibilityLabel}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{inner}</View>;
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
  cardPressed: { backgroundColor: colors.primary50 },
  header: { marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.titleSmall, color: colors.textPrimary, textAlign: 'center' },
});
