import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CaretRight, UserPlus } from 'phosphor-react-native';

import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { showToast } from '@/shared/utils/toast';
import { colors, iconSizes, spacing, typography, radii } from '@/shared/theme';

import { useDeleteAccountMutation } from '../mutations/useDeleteAccountMutation';
import {
  useProfileQuery,
  useFamilyIdQuery,
  useFamilyMembersQuery,
  useCurrentUserRoleQuery,
  useUpdateProfilePhotoMutation,
} from '../hooks/useAccountsCenter';
import type { FamilyMember, FamilyRole } from '../repositories/accounts-center.repository';

import { EditNameModal } from '../components/EditNameModal';
import { EditEmailModal } from '../components/EditEmailModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

const ROLE_LABELS: Record<FamilyRole, string> = {
  admin: 'Admin',
  'co-admin': 'Co-admin',
  collaborator: 'Collaborator',
  member: 'Member',
};

// --- Sub-components ---

function TappableInfoRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.infoRow} onPress={onPress}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueRow}>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
        <CaretRight size={iconSizes.inline} color={colors.textPlaceholder} />
      </View>
    </Pressable>
  );
}

function FamilyMemberRow({
  member,
  isCurrentUser,
  isTappable,
  onPress,
}: {
  member: FamilyMember;
  isCurrentUser: boolean;
  isTappable: boolean;
  onPress: () => void;
}) {
  const content = (
    <View style={styles.memberRow}>
      <Avatar
        imageUrl={member.avatarUrl}
        name={member.displayName}
        size="small"
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.displayName}
          {isCurrentUser ? ' (You)' : ''}
        </Text>
        <Text style={styles.memberRole}>{ROLE_LABELS[member.role]}</Text>
      </View>
      {isTappable ? (
        <CaretRight size={iconSizes.inline} color={colors.textPlaceholder} />
      ) : null}
    </View>
  );

  if (!isTappable) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function AccountsCenterSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonPlaceholder>
        <View style={styles.skeletonAvatar} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder style={styles.skeletonCard}>
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRowShort} />
        <View style={styles.skeletonRow} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder style={styles.skeletonCard}>
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRowShort} />
      </SkeletonPlaceholder>
    </View>
  );
}

function SocialLoginStub({ label }: { label: string }) {
  return (
    <View style={styles.socialRow}>
      <Text style={styles.socialLabel}>{label}</Text>
      <Text style={styles.comingSoonBadge}>Coming soon</Text>
    </View>
  );
}

// --- Main screen ---

export function AccountsCenterScreen() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { showDestructiveAlert } = useDestructiveAlert();

  // Zustand
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);
  const setMeasurementUnit = useUIPreferencesStore((s) => s.setMeasurementUnit);

  // Server state
  const profileQuery = useProfileQuery();
  const familyIdQuery = useFamilyIdQuery();
  const familyId = familyIdQuery.data ?? null;
  const membersQuery = useFamilyMembersQuery(familyId);
  const roleQuery = useCurrentUserRoleQuery(familyId);
  const deleteAccountMutation = useDeleteAccountMutation();
  const photoMutation = useUpdateProfilePhotoMutation();

  // Modal visibility
  const [showEditName, setShowEditName] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const profile = profileQuery.data;
  const members = membersQuery.data ?? [];
  const currentUserRole = roleQuery.data ?? 'member';
  const isLoading =
    profileQuery.isLoading || familyIdQuery.isLoading;
  const isError = profileQuery.isError || familyIdQuery.isError;

  const canInvite = currentUserRole === 'admin' || currentUserRole === 'co-admin';

  // --- Handlers ---

  const handleRetry = useCallback(() => {
    profileQuery.refetch();
    familyIdQuery.refetch();
    membersQuery.refetch();
    roleQuery.refetch();
  }, [profileQuery, familyIdQuery, membersQuery, roleQuery]);

  const handleToggleMeasurementUnit = useCallback(
    (useImperial: boolean) => {
      setMeasurementUnit(useImperial ? 'imperial' : 'metric');
    },
    [setMeasurementUnit],
  );

  const handlePickPhoto = useCallback(async () => {
    if (!isOnline) {
      showToast('warning', "You're offline. Please try again when connected.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      photoMutation.mutate(result.assets[0].uri);
    }
  }, [isOnline, photoMutation]);

  const handleMemberPress = useCallback(
    (member: FamilyMember) => {
      router.push({
        pathname: '/(settings)/accounts-center/[memberId]',
        params: {
          memberId: member.id,
          memberName: member.displayName,
          memberEmail: member.email,
          memberAvatarUrl: member.avatarUrl ?? '',
          memberRole: member.role,
          currentUserRole,
          familyId: familyId ?? '',
        },
      });
    },
    [router, currentUserRole, familyId],
  );

  const isMemberTappable = useCallback(
    (member: FamilyMember): boolean => {
      // Admin's own row is not tappable
      if (member.userId === profile?.id) return false;
      // Co-admin rows not tappable for other co-admins
      if (currentUserRole === 'co-admin' && member.role === 'co-admin') return false;
      // Collaborators and Members can't tap anyone
      if (currentUserRole === 'collaborator' || currentUserRole === 'member') return false;
      return true;
    },
    [profile?.id, currentUserRole],
  );

  const handleDeleteAccount = useCallback(() => {
    if (!isOnline) {
      showToast('warning', "You're offline. Please try again when connected.");
      return;
    }
    showDestructiveAlert({
      title: 'Delete your account?',
      message:
        "This will permanently delete your account, all children's profiles, all session data, and remove all family members. This cannot be undone.",
      destructiveLabel: 'Delete',
      onConfirm: () => {
        setShowDeleteConfirmation(true);
      },
    });
  }, [isOnline, showDestructiveAlert]);

  const handleFinalDelete = useCallback(() => {
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => setShowDeleteConfirmation(false),
    });
  }, [deleteAccountMutation]);

  const handleOpenModal = useCallback(
    (openFn: (v: boolean) => void) => {
      if (!isOnline) {
        showToast('warning', "You're offline. Please try again when connected.");
        return;
      }
      openFn(true);
    },
    [isOnline],
  );

  // --- Render ---

  if (isError) {
    return (
      <View style={styles.fullScreen}>
        <ErrorState onRetry={handleRetry} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.fullScreen}>
        <OfflineBanner />
        <AccountsCenterSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <OfflineBanner />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <Card style={styles.card}>
          <Pressable style={styles.avatarContainer} onPress={handlePickPhoto}>
            <Avatar
              imageUrl={profile?.avatarUrl ?? null}
              name={profile?.displayName ?? ''}
              size="large"
            />
            <Text style={styles.changePhotoText}>Change photo</Text>
          </Pressable>

          <View style={styles.cardSeparator} />

          <TappableInfoRow
            label="Display name"
            value={profile?.displayName ?? ''}
            onPress={() => handleOpenModal(setShowEditName)}
          />
          <View style={styles.cardSeparator} />
          <TappableInfoRow
            label="Email"
            value={profile?.email ?? ''}
            onPress={() => handleOpenModal(setShowEditEmail)}
          />
          <View style={styles.cardSeparator} />
          <Pressable
            style={styles.infoRow}
            onPress={() => handleOpenModal(setShowChangePassword)}
          >
            <Text style={styles.changePasswordText}>Change password</Text>
            <CaretRight size={iconSizes.inline} color={colors.textPlaceholder} />
          </Pressable>
        </Card>

        {/* Family section */}
        <Text style={styles.sectionTitle}>Family</Text>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Use imperial units</Text>
              <Text style={styles.toggleDescription}>
                {measurementUnit === 'imperial' ? 'lbs, ft/in' : 'kg, cm'}
              </Text>
            </View>
            <Switch
              value={measurementUnit === 'imperial'}
              onValueChange={handleToggleMeasurementUnit}
              trackColor={{ false: colors.borderDefault, true: colors.primary100 }}
              thumbColor={
                measurementUnit === 'imperial' ? colors.primary500 : colors.surface
              }
            />
          </View>

          {members.length > 0 ? (
            <>
              <View style={styles.cardSeparator} />
              <View style={styles.memberList}>
                {members.map((member) => (
                  <FamilyMemberRow
                    key={member.id}
                    member={member}
                    isCurrentUser={member.userId === profile?.id}
                    isTappable={isMemberTappable(member)}
                    onPress={() => handleMemberPress(member)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {canInvite ? (
            <>
              <View style={styles.cardSeparator} />
              <Pressable
                style={styles.inviteRow}
                onPress={() => handleOpenModal(setShowInviteModal)}
              >
                <UserPlus
                  size={iconSizes.body}
                  color={colors.primary500}
                />
                <Text style={styles.inviteText}>Invite member</Text>
              </Pressable>
            </>
          ) : null}
        </Card>

        {/* Account section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.card}>
          <SocialLoginStub label="Sign in with Apple" />
          <View style={styles.cardSeparator} />
          <SocialLoginStub label="Sign in with Google" />
        </Card>

        <Card style={styles.dangerCard}>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </Text>
          <Button
            title="Delete my account"
            variant="destructive"
            size="small"
            onPress={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
          />
        </Card>
      </ScrollView>

      {/* Modals */}
      <EditNameModal
        visible={showEditName}
        currentName={profile?.displayName ?? ''}
        onDismiss={() => setShowEditName(false)}
      />
      <EditEmailModal
        visible={showEditEmail}
        currentEmail={profile?.email ?? ''}
        onDismiss={() => setShowEditEmail(false)}
      />
      <ChangePasswordModal
        visible={showChangePassword}
        onDismiss={() => setShowChangePassword(false)}
      />
      {familyId ? (
        <InviteMemberModal
          visible={showInviteModal}
          familyId={familyId}
          currentUserRole={currentUserRole}
          onDismiss={() => setShowInviteModal(false)}
        />
      ) : null}
      <DeleteConfirmationModal
        visible={showDeleteConfirmation}
        onConfirm={handleFinalDelete}
        onDismiss={() => setShowDeleteConfirmation(false)}
        isPending={deleteAccountMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
  },
  card: {
    gap: 0,
  },
  cardSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },

  // Profile photo
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  changePhotoText: {
    ...typography.caption,
    color: colors.primary500,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    minHeight: 44,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: spacing.md,
  },
  infoValue: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  changePasswordText: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  toggleInfo: {
    flex: 1,
    gap: spacing.xxxs,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
  toggleDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Members list
  memberList: {
    gap: spacing.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    minHeight: 44,
  },
  memberInfo: {
    flex: 1,
    gap: spacing.xxxs,
  },
  memberName: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
  memberRole: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },

  // Invite
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    minHeight: 44,
  },
  inviteText: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.primary500,
  },

  // Social login stubs
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
    minHeight: 44,
    opacity: 0.5,
  },
  socialLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  comingSoonBadge: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },

  // Danger
  dangerCard: {
    gap: spacing.sm,
    borderColor: colors.error50,
    marginTop: spacing.xs,
  },
  dangerDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Skeleton
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.lg,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
  },
  skeletonCard: {
    width: '100%',
    gap: spacing.sm,
    padding: spacing.md,
  },
  skeletonRow: {
    height: 16,
    width: '100%',
    borderRadius: radii.sm,
  },
  skeletonRowShort: {
    height: 16,
    width: '60%',
    borderRadius: radii.sm,
  },
});
