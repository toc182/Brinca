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
import { useUpdateDisplayNameMutation } from '../hooks/useAccountsCenter';

const MAX_NAME_LENGTH = 50;

interface EditNameModalProps {
  visible: boolean;
  currentName: string;
  onDismiss: () => void;
}

export function EditNameModal({ visible, currentName, onDismiss }: EditNameModalProps) {
  const [name, setName] = useState(currentName);
  const updateNameMutation = useUpdateDisplayNameMutation();

  const hasChanged = name.trim() !== currentName && name.trim().length > 0;

  const handleSave = () => {
    updateNameMutation.mutate(name.trim(), {
      onSuccess: () => onDismiss(),
    });
  };

  const handleShow = () => {
    setName(currentName);
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
          <Text style={styles.title}>Edit Display Name</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            returnKeyType="done"
            placeholder="Enter your name"
            placeholderTextColor={colors.textPlaceholder}
          />
          <Text style={styles.charCount}>
            {name.length}/{MAX_NAME_LENGTH}
          </Text>

          <Button
            title="Save"
            onPress={handleSave}
            disabled={!hasChanged || updateNameMutation.isPending}
            style={styles.saveButton}
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
  form: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
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
  },
  charCount: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
    textAlign: 'right',
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
