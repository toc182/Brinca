import { StyleSheet, TextInput, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';

interface SessionNotesProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SessionNotes({ value, onChangeText }: SessionNotesProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Session notes..."
        placeholderTextColor={colors.textPlaceholder}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md },
  input: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    minHeight: 80,
  },
});
