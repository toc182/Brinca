import { useContext, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { colors, typography, radii, spacing } from '../theme';
import { InBottomSheetContext } from './BottomSheet';

interface TextAreaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  label: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  minHeight?: number;
  /**
   * Override the auto-detected context. Inputs rendered anywhere inside a
   * shared BottomSheet pick this up automatically — only pass explicitly to
   * force a value.
   */
  inBottomSheet?: boolean;
}

/**
 * Multi-line text input matching the shared `Input` component's visual
 * language: same border, focus, and error treatments. Unlike `Input` which
 * locks itself to a single 48px row (so `lineHeight` doesn't top-align text
 * on iOS), TextArea auto-grows to fit content from `minHeight` down.
 */
export function TextArea({
  label,
  error,
  disabled = false,
  style,
  minHeight = 120,
  inBottomSheet,
  ...textInputProps
}: TextAreaProps) {
  const [focused, setFocused] = useState(false);
  const contextInSheet = useContext(InBottomSheetContext);
  const effectiveInSheet = inBottomSheet ?? contextInSheet;

  const inputStyle = [
    styles.input,
    { minHeight },
    focused && styles.inputFocused,
    error ? styles.inputError : undefined,
    disabled ? styles.inputDisabled : undefined,
  ];

  const labelStyle = [
    styles.label,
    error ? styles.labelError : undefined,
    disabled ? styles.labelDisabled : undefined,
  ];

  const TextInputComponent = effectiveInSheet ? BottomSheetTextInput : TextInput;

  return (
    <View style={[styles.container, style]}>
      <Text style={labelStyle}>{label}</Text>
      <TextInputComponent
        {...textInputProps}
        editable={!disabled}
        multiline
        textAlignVertical="top"
        style={inputStyle}
        placeholderTextColor={colors.textPlaceholder}
        selectionColor={error ? colors.error500 : colors.primary500}
        onFocus={(e) => {
          setFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          textInputProps.onBlur?.(e);
        }}
      />
      {error ? (
        <View style={styles.errorSlot}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error700,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.primary500,
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: colors.error500,
    backgroundColor: 'rgba(255, 228, 234, 0.4)',
  },
  inputDisabled: {
    backgroundColor: colors.surfaceDisabled,
    color: colors.textDisabled,
  },
  errorSlot: {
    minHeight: 24,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.error700,
    marginTop: 6,
  },
});
