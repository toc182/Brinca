import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { FreeTextNoteConfig } from '@/shared/tracking-elements/types/element-configs';
import type { FreeTextNoteValue } from '@/shared/tracking-elements/types/element-values';

interface FreeTextNoteElementProps {
  value: FreeTextNoteValue;
  onValueChange: (value: FreeTextNoteValue) => void;
  config: FreeTextNoteConfig;
}

export function FreeTextNoteElement({ value, onValueChange, config }: FreeTextNoteElementProps) {
  // Auto-save: the parent DrillScreen's handleValueChange debounces SQLite writes.
  // We call onValueChange on every keystroke so the debounce kicks in periodically.
  // For an additional periodic flush, we also call it on a 3-second interval.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestValueRef = useRef(value.text);

  const handleChangeText = useCallback((text: string) => {
    latestValueRef.current = text;
    onValueChange({ text });
  }, [onValueChange]);

  // Periodic auto-save every 3 seconds (ensures SQLite is updated even mid-typing)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      onValueChange({ text: latestValueRef.current });
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onValueChange]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value.text}
        onChangeText={handleChangeText}
        placeholder={config.placeholder ?? 'Write a note...'}
        placeholderTextColor={colors.textPlaceholder}
        multiline
        textAlignVertical="top"
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 120,
  },
});
