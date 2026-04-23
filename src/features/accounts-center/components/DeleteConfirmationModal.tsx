import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/shared/components/Button';
import { colors, spacing, typography, radii } from '@/shared/theme';

const CONFIRMATION_WORD = 'DELETE';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  isPending: boolean;
}

export function DeleteConfirmationModal({
  visible,
  onConfirm,
  onDismiss,
  isPending,
}: DeleteConfirmationModalProps) {
  const [input, setInput] = useState('');
  const isMatch = input.trim().toUpperCase() === CONFIRMATION_WORD;

  const handleShow = () => {
    setInput('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onDismiss}
      onShow={handleShow}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Confirm Deletion</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.warningText}>
            This action is permanent and cannot be undone. All your data will be deleted.
          </Text>

          <Text style={styles.instructionText}>
            Type <Text style={styles.deleteWord}>{CONFIRMATION_WORD}</Text> to confirm.
          </Text>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            placeholder={`Type ${CONFIRMATION_WORD}`}
            placeholderTextColor={colors.textPlaceholder}
          />

          <Button
            title="Delete my account"
            variant="destructive"
            onPress={onConfirm}
            disabled={!isMatch || isPending}
            style={styles.deleteButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  cancelText: {
    ...typography.body,
    color: colors.primary500,
  },
  title: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  warningText: {
    ...typography.body,
    color: colors.error700,
  },
  instructionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  deleteWord: {
    fontFamily: 'Lexend_700Bold',
    color: colors.textPrimary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    textAlign: 'center',
    letterSpacing: 2,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});
