import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { showToast } from '@/shared/utils/toast';
import { colors, spacing, typography, radii } from '@/shared/theme';

import {
  useChangeMemberRoleMutation,
  useRemoveFamilyMemberMutation,
} from '../hooks/useAccountsCenter';
import type { FamilyRole } from '../repositories/accounts-center.repository';

const ROLE_LABELS: Record<FamilyRole, string> = {
  admin: 'Admin',
  'co-admin': 'Co-admin',
  collaborator: 'Collaborator',
  member: 'Member',
};

function getAvailableRolesForChange(
  currentUserRole: FamilyRole,
  targetRole: FamilyRole,
): FamilyRole[] {
  if (currentUserRole === 'admin') {
    // Admin can change to any role except admin (only one admin)
    return (['co-admin', 'collaborator', 'member'] as FamilyRole[]).filter(
      (r) => r !== targetRole,
    );
  }
  if (currentUserRole === 'co-admin') {
    // Co-admin can only change collaborators and members
    if (targetRole === 'collaborator' || targetRole === 'member') {
      return (['collaborator', 'member'] as FamilyRole[]).filter(
        (r) => r !== targetRole,
      );
    }
  }
  return [];
}

export function MemberDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    memberId: string;
    memberName: string;
    memberEmail: string;
    memberAvatarUrl: string;
    memberRole: string;
    currentUserRole: string;
    familyId: string;
  }>();

  const { isOnline } = useNetworkStatus();
  const { showDestructiveAlert } = useDestructiveAlert();
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  const memberRole = (params.memberRole ?? 'member') as FamilyRole;
  const currentUserRole = (params.currentUserRole ?? 'member') as FamilyRole;
  const familyId = params.familyId ?? '';

  const changeRoleMutation = useChangeMemberRoleMutation(familyId);
  const removeMemberMutation = useRemoveFamilyMemberMutation(familyId);

  const availableRoles = getAvailableRolesForChange(currentUserRole, memberRole);
  const canChangeRole = availableRoles.length > 0;
  const canRemove =
    currentUserRole === 'admin' ||
    (currentUserRole === 'co-admin' &&
      (memberRole === 'collaborator' || memberRole === 'member'));

  const handleChangeRole = useCallback(
    (newRole: FamilyRole) => {
      if (!isOnline) {
        showToast('warning', "You're offline. Please try again when connected.");
        return;
      }
      changeRoleMutation.mutate(
        { memberId: params.memberId ?? '', newRole },
        { onSuccess: () => setShowRoleSheet(false) },
      );
    },
    [isOnline, changeRoleMutation, params.memberId],
  );

  const handleRemove = useCallback(() => {
    if (!isOnline) {
      showToast('warning', "You're offline. Please try again when connected.");
      return;
    }
    showDestructiveAlert({
      title: `Remove ${params.memberName} from your family?`,
      message:
        'They will lose access to all children and session data.',
      destructiveLabel: 'Remove',
      onConfirm: () => {
        removeMemberMutation.mutate(params.memberId ?? '', {
          onSuccess: () => router.back(),
        });
      },
    });
  }, [
    isOnline,
    showDestructiveAlert,
    params.memberName,
    params.memberId,
    removeMemberMutation,
    router,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Avatar
          imageUrl={params.memberAvatarUrl || null}
          name={params.memberName ?? ''}
          size="large"
        />
        <Text style={styles.name}>{params.memberName}</Text>
        {params.memberEmail ? (
          <Text style={styles.email}>{params.memberEmail}</Text>
        ) : null}
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{ROLE_LABELS[memberRole]}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {canChangeRole ? (
          <Card>
            <Pressable
              style={styles.actionRow}
              onPress={() => setShowRoleSheet(true)}
            >
              <Text style={styles.actionText}>Change role</Text>
              <Text style={styles.actionChevron}>›</Text>
            </Pressable>
          </Card>
        ) : null}

        {canRemove ? (
          <Button
            title="Remove from family"
            variant="text"
            onPress={handleRemove}
            disabled={removeMemberMutation.isPending}
            style={styles.removeButton}
          />
        ) : null}
      </View>

      {showRoleSheet ? (
        <BottomSheet
          snapPoints={['35%']}
          onDismiss={() => setShowRoleSheet(false)}
        >
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Change Role</Text>
            <Text style={styles.sheetSubtitle}>
              Current role: {ROLE_LABELS[memberRole]}
            </Text>
            {availableRoles.map((role) => (
              <Pressable
                key={role}
                style={styles.roleOption}
                onPress={() => handleChangeRole(role)}
              >
                <Text style={styles.roleOptionText}>{ROLE_LABELS[role]}</Text>
              </Pressable>
            ))}
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  name: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    marginTop: spacing.xxs,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.primary700,
    fontFamily: 'Lexend_600SemiBold',
  },
  actions: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionChevron: {
    ...typography.titleMedium,
    color: colors.textPlaceholder,
  },
  removeButton: {
    alignSelf: 'center',
  },
  sheetContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  roleOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  roleOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
