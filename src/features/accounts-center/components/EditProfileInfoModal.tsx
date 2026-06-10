import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Check } from 'phosphor-react-native';

import { MODAL_HEADER_CONTENT_BOTTOM, ModalHeader } from '@/shared/components/ModalHeader';
import { colors, spacing, typography, radii, iconSizes } from '@/shared/theme';
import { useUpdateProfileInfoMutation } from '../hooks/useAccountsCenter';
import type { PersonaType } from '../repositories/accounts-center.repository';

const MAX_NAME_LENGTH = 50;

const PERSONA_OPTIONS: { value: PersonaType; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'coach', label: 'Coach' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'other', label: 'Other' },
];

interface EditProfileInfoModalProps {
  visible: boolean;
  currentName: string;
  currentPersonaType: PersonaType | null;
  onDismiss: () => void;
}

export function EditProfileInfoModal({
  visible,
  currentName,
  currentPersonaType,
  onDismiss,
}: EditProfileInfoModalProps) {
  const [name, setName] = useState(currentName);
  const [personaType, setPersonaType] = useState<PersonaType | null>(currentPersonaType);
  const updateMutation = useUpdateProfileInfoMutation();

  const trimmedName = name.trim();
  const hasValidName = trimmedName.length > 0;
  const hasChanged =
    (trimmedName !== currentName || personaType !== currentPersonaType) &&
    hasValidName;

  const handleSave = () => {
    if (!hasChanged) return;
    updateMutation.mutate(
      { name: trimmedName, personaType },
      { onSuccess: () => onDismiss() },
    );
  };

  const handleShow = () => {
    setName(currentName);
    setPersonaType(currentPersonaType);
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
        <ModalHeader
          title="Edit Profile"
          leftAction={{
            icon: 'back',
            onPress: onDismiss,
            accessibilityLabel: 'Back',
          }}
          rightAction={{
            icon: 'check',
            onPress: handleSave,
            disabled: !hasChanged || updateMutation.isPending,
            accessibilityLabel: 'Save',
          }}
        />
        <KeyboardAwareScrollView
          style={styles.formWrapper}
          contentContainerStyle={[
            styles.form,
            { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md },
          ]}
          keyboardShouldPersistTaps="handled"
        >
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

            <Text style={[styles.label, styles.labelSpacing]}>Role</Text>
            <View style={styles.optionList}>
              {PERSONA_OPTIONS.map((option, index) => {
                const selected = personaType === option.value;
                return (
                  <View key={option.value}>
                    {index > 0 ? <View style={styles.separator} /> : null}
                    <Pressable
                      style={styles.optionRow}
                      onPress={() => setPersonaType(option.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      {selected ? (
                        <Check
                          size={iconSizes.inline}
                          color={colors.primary500}
                          weight="bold"
                        />
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formWrapper: {
    flex: 1,
  },
  form: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  labelSpacing: {
    marginTop: spacing.md,
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
  optionList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md,
  },
});
