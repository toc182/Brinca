import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '../theme';

type BadgeVariant = 'active' | 'completed' | 'paused' | 'missed' | 'scheduled' | 'achievement';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  active: { bg: colors.info50, text: colors.info700 },
  completed: { bg: colors.success50, text: colors.success700 },
  paused: { bg: colors.warning50, text: colors.warning700 },
  missed: { bg: colors.error50, text: colors.error700 },
  scheduled: { bg: colors.borderSubtle, text: colors.textSecondary },
  achievement: { bg: colors.accent50, text: colors.accent600 },
};

export function Badge({ label, variant, style }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 22,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
  },
});
