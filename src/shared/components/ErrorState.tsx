import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';

import { colors, iconSizes, spacing, typography } from '../theme';
import { Button } from './Button';

interface ErrorStateProps {
  onRetry: () => void;
  style?: ViewStyle;
}

/**
 * Screen-level error state: icon + message + retry button.
 * Centered vertically in available space.
 * Per UX conventions §4 (empty/error states).
 */
export function ErrorState({ onRetry, style }: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <WarningCircle
        size={iconSizes.hero}
        color={colors.error500}
        weight="duotone"
      />
      <Text style={styles.message}>Something went wrong.</Text>
      <Button
        title="Try again"
        onPress={onRetry}
        variant="secondary"
        size="small"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
    marginTop: spacing.xs,
  },
});