import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from 'react-native';

import { colors, typography, radii, spacing, touchTargets } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'text' | 'ghost';
type ButtonSize = 'large' | 'small';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  pill?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  pill = false,
  style,
}: ButtonProps) {
  const containerStyle = getContainerStyle(variant, size, disabled, pill);
  const textStyle = getTextStyle(variant, size, disabled);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

function getContainerStyle(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  pill: boolean,
): ViewStyle {
  const base: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: pill ? radii.full : radii.md,
    minHeight: size === 'large' ? touchTargets.adult : touchTargets.min,
    paddingHorizontal: spacing.md,
  };

  if (disabled) {
    return {
      ...base,
      backgroundColor: colors.surfaceDisabled,
    };
  }

  switch (variant) {
    case 'primary':
      return { ...base, backgroundColor: colors.primary500 };
    case 'secondary':
      return { ...base, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderDefault };
    case 'destructive':
      return { ...base, backgroundColor: colors.error600 };
    case 'text':
      return { ...base, backgroundColor: 'transparent' };
    case 'ghost':
      return { ...base, backgroundColor: 'transparent' };
  }
}

function getTextStyle(variant: ButtonVariant, size: ButtonSize, disabled: boolean): TextStyle {
  const base = size === 'large' ? typography.buttonLarge : typography.buttonSmall;

  if (disabled) {
    return { ...base, color: colors.textDisabled };
  }

  switch (variant) {
    case 'primary':
      return { ...base, color: colors.textOnPrimary };
    case 'secondary':
      return { ...base, color: colors.primary500 };
    case 'destructive':
      return { ...base, color: colors.textOnPrimary };
    case 'text':
      return { ...base, color: colors.primary500 };
    case 'ghost':
      return { ...base, color: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
});
