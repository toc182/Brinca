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
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value.text}
        onChangeText={(text) => onValueChange({ text })}
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
  container: {
    width: '100%',
  },
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
