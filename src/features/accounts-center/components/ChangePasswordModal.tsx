import { useState, useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, X } from 'phosphor-react-native';

import { Button } from '@/shared/components/Button';
import { colors, spacing, typography, radii, iconSizes } from '@/shared/theme';
import { useUpdatePasswordMutation } from '../hooks/useAccountsCenter';

interface ChangePasswordModalProps {
  visible: boolean;
  onDismiss: () => void;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function usePasswordRequirements(password: string): PasswordRequirement[] {
  return useMemo(
    () => [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'One number', met: /[0-9]/.test(password) },
      { label: 'One special character (!@#$%...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ],
    [password],
  );
}

export function ChangePasswordModal({ visible, onDismiss }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const updatePasswordMutation = useUpdatePasswordMutation();

  const requirements = usePasswordRequirements(newPassword);
  const allRequirementsMet = requirements.every((r) => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const canSave =
    currentPassword.length > 0 && allRequirementsMet && passwordsMatch;

  const handleSave = () => {
    setCurrentPasswordError('');
    updatePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => onDismiss(),
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Something went wrong.';
          if (message.includes('password')) {
            setCurrentPasswordError('Current password is incorrect.');
          } else {
            setCurrentPasswordError(message);
          }
        },
      },
    );
  };

  const handleShow = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError('');
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
          <Text style={styles.title}>Change Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={[styles.input, currentPasswordError ? styles.inputError : undefined]}
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setCurrentPasswordError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            autoFocus
            returnKeyType="next"
            placeholder="Enter current password"
            placeholderTextColor={colors.textPlaceholder}
          />
          {currentPasswordError ? (
            <Text style={styles.errorText}>{currentPasswordError}</Text>
          ) : null}

          <Text style={[styles.label, styles.labelSpacing]}>New password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="next"
            placeholder="Enter new password"
            placeholderTextColor={colors.textPlaceholder}
          />

          <View style={styles.requirements}>
            {requirements.map((req) => (
              <View key={req.label} style={styles.requirementRow}>
                {req.met ? (
                  <Check size={iconSizes.inline} color={colors.success500} weight="bold" />
                ) : (
                  <X size={iconSizes.inline} color={colors.textPlaceholder} weight="bold" />
                )}
                <Text
                  style={[
                    styles.requirementText,
                    req.met && styles.requirementMet,
                  ]}
                >
                  {req.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Confirm new password</Text>
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && !passwordsMatch ? styles.inputError : undefined,
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textPlaceholder}
          />
          {confirmPassword.length > 0 && !passwordsMatch ? (
            <Text style={styles.errorText}>Passwords do not match.</Text>
          ) : null}

          <Button
            title="Save"
            onPress={handleSave}
            disabled={!canSave || updatePasswordMutation.isPending}
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
  inputError: {
    borderColor: colors.error500,
  },
  errorText: {
    ...typography.caption,
    color: colors.error700,
    marginTop: spacing.xxs,
  },
  requirements: {
    marginTop: spacing.sm,
    gap: spacing.xxs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  requirementText: {
    ...typography.caption,
    color: colors.textPlaceholder,
  },
  requirementMet: {
    color: colors.success700,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
