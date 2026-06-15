import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CaretRight, Plus, UserPlus } from 'phosphor-react-native';

import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { Screen } from '@/shared/components/Screen';
import { MODAL_HEADER_CONTENT_BOTTOM, ModalHeader } from '@/shared/components/ModalHeader';
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
import type { FamilyMember, FamilyRole, PersonaType } from '../repositories/accounts-center.repository';

import { getChildrenByFamily } from '@/features/profile/repositories/profile.repository';
import { signAvatarUrl } from '@/lib/supabase/avatar';
import { refreshChildrenFromServer } from '@/lib/supabase/child-sync';
import { profileKeys } from '@/features/profile/queries/keys';

import { EditProfileInfoModal } from '../components/EditProfileInfoModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

const ROLE_LABELS: Record<FamilyRole, string> = {
  admin: 'Admin',
  'co-admin': 'Co-admin',
  collaborator: 'Collaborator',
  member: 'Member',
};

const PERSONA_LABELS: Record<PersonaType, string> = {
  parent: 'Parent',
  therapist: 'Therapist',
  coach: 'Coach',
  teacher: 'Teacher',
  other: 'Other',
};

// --- Sub-components ---

function ChildRow({
  name,
  avatarUrl,
  dateOfBirth,
}: {
  name: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
}) {
  return (
    <View style={styles.memberRow}>
      <Avatar imageUrl={avatarUrl} name={name} size="small" />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        {dateOfBirth ? (
          <Text style={styles.memberRole}>{calculateAge(dateOfBirth)}</Text>
        ) : null}
      </View>
    </View>
  );
}

function calculateAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${age} yrs`;
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
  const insets = useSafeAreaInsets();

  // Server state
  const profileQuery = useProfileQuery();
  const familyIdQuery = useFamilyIdQuery();
  const familyId = familyIdQuery.data ?? null;
  const membersQuery = useFamilyMembersQuery(familyId);
  const roleQuery = useCurrentUserRoleQuery(familyId);
  const deleteAccountMutation = useDeleteAccountMutation();
  const photoMutation = useUpdateProfilePhotoMutation();

  const { data: childrenList = [] } = useQuery({
    queryKey: profileKeys.children(familyId ?? ''),
    queryFn: async () => {
      await refreshChildrenFromServer(familyId!);
      const rows = await getChildrenByFamily(familyId!);
      return Promise.all(
        rows.map(async (r) => ({ ...r, avatar_url: await signAvatarUrl(r.avatar_url) })),
      );
    },
    enabled: !!familyId,
  });

  // Modal visibility (email modal removed — email is now read-only per spec)
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Explicit-save dirty state for the photo on the Profile card. The profile
  // info modal (name + persona type) self-commits from its own ✓ button, so
  // those don't need staging slots here. Photo:
  // - `pickedUri` holds the locally picked URI — null = unchanged. Uploads
  //   only when the user taps ✓ Save on Accounts Center.
  // - `isPickerLaunching` covers the 3–4 sec OS picker mount delay.
  // - `isSavingChanges` covers the commit phase (between ✓ tap and close).
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [isPickerLaunching, setIsPickerLaunching] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

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

const handlePickPhoto = useCallback(async () => {
    if (!isOnline) {
      showToast('warning', "You're offline. Please try again when connected.");
      return;
    }
    setIsPickerLaunching(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Per data-persistence spec: stage the local URI only — do NOT upload
      // now. The upload happens on ✓ Save.
      if (!result.canceled && result.assets[0]) {
        setPickedUri(result.assets[0].uri);
      }
    } finally {
      setIsPickerLaunching(false);
    }
  }, [isOnline]);

  const handleAddChild = useCallback(() => {
    router.push('/(settings)/add-child');
  }, [router]);

  // Dirty when a new photo has been picked. Name + email + password all
  // commit independently via their own modals (or are read-only), so they
  // don't contribute to the screen-level dirty state.
  const displayName = profile?.displayName ?? '';
  const isDirty = pickedUri !== null;

  const handleSaveAndClose = useCallback(async () => {
    if (!isDirty) {
      router.back();
      return;
    }
    setIsSavingChanges(true);
    try {
      if (pickedUri !== null) {
        await photoMutation.mutateAsync(pickedUri);
      }
      router.back();
    } catch {
      // Mutation shows its own error toast; stay on screen so the user
      // can retry without losing the staged photo.
    } finally {
      setIsSavingChanges(false);
    }
  }, [isDirty, pickedUri, photoMutation, router]);

  const handleBack = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }
    showDestructiveAlert({
      title: 'Discard changes?',
      message: 'You have unsaved changes. Discard them?',
      destructiveLabel: 'Discard',
      onConfirm: () => router.back(),
    });
  }, [isDirty, router, showDestructiveAlert]);

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

  const header = (
    <ModalHeader
      title="Accounts Center"
      leftAction={{ icon: 'back', onPress: handleBack, accessibilityLabel: 'Back' }}
      rightAction={{
        icon: 'check',
        onPress: handleSaveAndClose,
        disabled: isSavingChanges,
        accessibilityLabel: 'Save',
      }}
    />
  );

  if (isError) {
    return (
      <>
      {header}
      <Screen edges={['bottom']}>
      <View style={[styles.fullScreen, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}>
        <ErrorState onRetry={handleRetry} />
      </View>
      </Screen>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
      {header}
      <Screen edges={['bottom']}>
      <View style={[styles.fullScreen, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}>
        <OfflineBanner />
        <AccountsCenterSkeleton />
      </View>
      </Screen>
      </>
    );
  }

  return (
    <>
    {header}
    <Screen edges={[]}>
    <View style={styles.fullScreen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerInScroll}>
          <OfflineBanner />
        </View>

        {/* Profile card */}
        <Card style={styles.card}>
          {(() => {
            const showPhotoSpinner =
              isPickerLaunching ||
              (isSavingChanges && photoMutation.isPending);
            const displayAvatarUrl = pickedUri ?? profile?.avatarUrl ?? null;
            return (
              <View style={styles.profileBlock}>
                <Pressable
                  style={styles.profileInfo}
                  onPress={() => handleOpenModal(setShowEditProfile)}
                >
                  <Text style={styles.nameText} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {profile?.personaType ? (
                    <Text style={styles.profileInfoText} numberOfLines={1}>
                      {PERSONA_LABELS[profile.personaType]}
                    </Text>
                  ) : null}
                  <Text style={styles.profileInfoText} numberOfLines={1}>
                    {profile?.email ?? ''}
                  </Text>
                  <Text style={styles.profileInfoText} numberOfLines={1}>
                    {profile?.displayId ?? ''}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.photoPressable}
                  onPress={handlePickPhoto}
                  disabled={showPhotoSpinner || isSavingChanges}
                >
                  <View>
                    <Avatar
                      imageUrl={displayAvatarUrl}
                      name={displayName}
                      size="large"
                    />
                    {showPhotoSpinner ? (
                      <View style={styles.avatarSpinnerOverlay}>
                        <ActivityIndicator color={colors.textOnPrimary} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.changePhotoText}>Change photo</Text>
                </Pressable>
              </View>
            );
          })()}

          <View style={styles.cardSeparator} />

          <Pressable
            style={styles.infoRow}
            onPress={() => handleOpenModal(setShowChangePassword)}
          >
            <Text style={styles.changePasswordText}>Change password</Text>
            <CaretRight size={iconSizes.inline} color={colors.textPlaceholder} />
          </Pressable>
        </Card>

        {/* Children section */}
        <Text style={styles.sectionTitle}>Children</Text>
        <Card style={styles.card}>
          {childrenList.length > 0 ? (
            <>
              <View style={styles.memberList}>
                {childrenList.map((child) => (
                  <ChildRow
                    key={child.id}
                    name={child.name}
                    avatarUrl={child.avatar_url}
                    dateOfBirth={child.date_of_birth}
                  />
                ))}
              </View>
              <View style={styles.cardSeparator} />
            </>
          ) : null}
          <Pressable style={styles.inviteRow} onPress={handleAddChild}>
            <Plus size={iconSizes.body} color={colors.primary500} />
            <Text style={styles.inviteText}>Add child</Text>
          </Pressable>
        </Card>

        {/* Family section */}
        <Text style={styles.sectionTitle}>Family</Text>
        <Card style={styles.card}>
          {members.length > 0 ? (
            <>
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
      <EditProfileInfoModal
        visible={showEditProfile}
        currentName={displayName}
        currentPersonaType={profile?.personaType ?? null}
        onDismiss={() => setShowEditProfile(false)}
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
    </Screen>
    </>
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
  },
  bannerInScroll: { marginHorizontal: -spacing.md },
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

  // Profile card
  nameText: {
    ...typography.titleMedium,
    color: colors.textPrimary,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxs,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xxxs,
  },
  profileInfoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  photoPressable: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  changePhotoText: {
    ...typography.caption,
    color: colors.primary500,
  },
  avatarSpinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 11, 31, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    minHeight: 44,
  },
  changePasswordText: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
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
