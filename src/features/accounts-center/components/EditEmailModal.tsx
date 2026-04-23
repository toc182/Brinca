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
import { useUpdateEmailMutation } from '../hooks/useAccountsCenter';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EditEmailModalProps {
  visible: boolean;
  currentEmail: string;
  onDismiss: () => void;
}

export function EditEmailModal({ visible, currentEmail, onDismiss }: EditEmailModalProps) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const updateEmailMutation = useUpdateEmailMutation();

  const isValidEmail = EMAIL_REGEX.test(email);
  const hasChanged = email.trim().toLowerCase() !== currentEmail.toLowerCase();
  const canSave = hasChanged && isValidEmail && password.length > 0;

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
  };

  const handleEmailBlur = () => {
    if (email.length > 0 && !isValidEmail) {
      setEmailError('Please enter a valid email address.');
    }
  };

  const handleSave = () => {
    setPasswordError('');
    updateEmailMutation.mutate(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: () => onDismiss(),
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Something went wrong.';
          if (message.includes('password')) {
            setPasswordError('Current password is incorrect.');
          } else if (message.includes('already') || message.includes('exists')) {
            setEmailError('An account with this email already exists.');
          } else {
            setPasswordError(message);
          }
        },
      },
    );
  };

  const handleShow = () => {
    setEmail(currentEmail);
    setPassword('');
    setEmailError('');
    setPasswordError('');
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
          <Text style={styles.title}>Edit Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>New email address</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : undefined]}
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            placeholder="Enter new email"
            placeholderTextColor={colors.textPlaceholder}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Current password</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : undefined]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            placeholder="Enter current password"
            placeholderTextColor={colors.textPlaceholder}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <Button
            title="Save"
            onPress={handleSave}
            disabled={!canSave || updateEmailMutation.isPending}
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
  saveButton: {
    marginTop: spacing.lg,
  },
});
