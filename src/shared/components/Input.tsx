import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, typography, radii, spacing } from '../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Input({
  label,
  error,
  required = false,
  disabled = false,
  style,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const inputStyle = [
    styles.input,
    focused && styles.inputFocused,
    error ? styles.inputError : undefined,
    disabled ? styles.inputDisabled : undefined,
  ];

  const labelStyle = [
    styles.label,
    error ? styles.labelError : undefined,
    disabled ? styles.labelDisabled : undefined,
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={labelStyle}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        {...textInputProps}
        editable={!disabled}
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
      <View style={styles.errorSlot}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
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
  required: {
    color: colors.error500,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    ...typography.bodySmall,
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
