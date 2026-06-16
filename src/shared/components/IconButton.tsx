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
 * Circular icon-only button built on a real Phosphor icon (no text glyphs).
 * Shared primitive for element controls (counter +/-, etc.) so size, color,
 * and pressed/disabled states live in one place instead of being re-styled
 * per element.
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
      : colors.primary700;

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
      <IconCmp size={Math.round(size * 0.42)} color={iconColor} weight="bold" />
    </Pressable>
  );
}

function variantStyle(variant: IconButtonVariant, disabled: boolean): ViewStyle {
  if (disabled) return { backgroundColor: colors.surfaceDisabled };
  switch (variant) {
    case 'filled':
      return { backgroundColor: colors.primary500 };
    case 'outline':
      return { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary500 };
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
