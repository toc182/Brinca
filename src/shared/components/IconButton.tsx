import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import type { Icon } from 'phosphor-react-native';

import { colors, touchTargets } from '@/shared/theme';

type IconButtonVariant = 'filled' | 'outline' | 'subtle';

interface IconButtonProps {
  /** A Phosphor icon component, e.g. `Plus` or `Minus`. */
  icon: Icon;
  onPress: () => void;
  onLongPress?: () => void;
  /** Diameter in px. Defaults to the kid-large touch target (64). */
  size?: number;
  variant?: IconButtonVariant;
  disabled?: boolean;
  accessibilityLabel: string;
}

/**
 * Circular icon button: a brand-colored circle (the button) with a real
 * Phosphor icon inside (the symbol). One place for size, color, and
 * pressed/disabled states so element controls don't re-style circles by hand.
 */
export function IconButton({
  icon: IconCmp,
  onPress,
  onLongPress,
  size = touchTargets.kidLarge,
  variant = 'filled',
  disabled = false,
  accessibilityLabel,
}: IconButtonProps) {
  const iconColor = disabled
    ? colors.textDisabled
    : variant === 'filled'
      ? colors.textOnPrimary
      : colors.primary500;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variantStyle(variant, disabled),
        pressed && !disabled && styles.pressed,
      ]}
    >
      <IconCmp size={Math.round(size * 0.5)} color={iconColor} weight="bold" />
    </Pressable>
  );
}

function variantStyle(variant: IconButtonVariant, disabled: boolean): ViewStyle {
  if (disabled) return { backgroundColor: colors.surfaceDisabled };
  switch (variant) {
    case 'filled':
      return { backgroundColor: colors.primary500 };
    case 'outline':
      return { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary500 };
    case 'subtle':
      return { backgroundColor: colors.primary50 };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
