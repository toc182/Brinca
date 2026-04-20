import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, typography, spacing } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  body: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  body,
  ctaLabel,
  onCtaPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onCtaPress ? (
        <Button
          title={ctaLabel}
          onPress={onCtaPress}
          variant="primary"
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: {
    marginTop: spacing.xs,
    minWidth: 160,
  },
});
