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
import { useSendInviteMutation } from '../hooks/useAccountsCenter';
import type { FamilyRole } from '../repositories/accounts-center.repository';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteMemberModalProps {
  visible: boolean;
  familyId: string;
  currentUserRole: FamilyRole;
  onDismiss: () => void;
}

const ROLE_LABELS: Record<FamilyRole, string> = {
  admin: 'Admin',
  'co-admin': 'Co-admin',
  collaborator: 'Collaborator',
  member: 'Member',
};

function getAvailableRoles(currentUserRole: FamilyRole): FamilyRole[] {
  if (currentUserRole === 'admin') {
    return ['co-admin', 'collaborator', 'member'];
  }
  if (currentUserRole === 'co-admin') {
    return ['collaborator', 'member'];
  }
  return [];
}

export function InviteMemberModal({
  visible,
  familyId,
  currentUserRole,
  onDismiss,
}: InviteMemberModalProps) {
  const availableRoles = getAvailableRoles(currentUserRole);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<FamilyRole>(availableRoles[0] ?? 'member');
  const [emailError, setEmailError] = useState('');
  const sendInviteMutation = useSendInviteMutation(familyId);

  const isValidEmail = EMAIL_REGEX.test(email);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
  };

  const handleEmailBlur = () => {
    if (email.length > 0 && !isValidEmail) {
      setEmailError('Please enter a valid email address.');
    }
  };

  const handleSend = () => {
    setEmailError('');
    sendInviteMutation.mutate(
      { email: email.trim().toLowerCase(), role: selectedRole },
      {
        onSuccess: () => onDismiss(),
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Something went wrong.';
          setEmailError(message);
        },
      },
    );
  };

  const handleShow = () => {
    setEmail('');
    setSelectedRole(availableRoles[0] ?? 'member');
    setEmailError('');
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
          <Text style={styles.title}>Invite Member</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : undefined]}
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            placeholder="Enter email address"
            placeholderTextColor={colors.textPlaceholder}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Role</Text>
          <View style={styles.roleList}>
            {availableRoles.map((role) => (
              <Pressable
                key={role}
                style={[
                  styles.roleOption,
                  selectedRole === role && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole(role)}
              >
                <Text
                  style={[
                    styles.roleLabel,
                    selectedRole === role && styles.roleLabelSelected,
                  ]}
                >
                  {ROLE_LABELS[role]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title="Send Invite"
            onPress={handleSend}
            disabled={!isValidEmail || email.length === 0 || sendInviteMutation.isPending}
            style={styles.sendButton}
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
    marginTop: spacing.lg,
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
  roleList: {
    gap: spacing.xs,
  },
  roleOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  roleOptionSelected: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  roleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  roleLabelSelected: {
    color: colors.primary700,
    fontFamily: 'Lexend_600SemiBold',
  },
  sendButton: {
    marginTop: spacing.lg,
  },
});
