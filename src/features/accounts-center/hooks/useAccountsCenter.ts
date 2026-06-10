import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { showToast } from '@/shared/utils/toast';
import {
  fetchProfile,
  fetchFamilyMembers,
  fetchCurrentUserFamilyId,
  fetchCurrentUserRole,
  updateProfileInfo,
  updateEmail,
  updatePassword,
  uploadProfilePhoto,
  updateProfilePhoto,
  sendInvite,
  changeMemberRole,
  removeFamilyMember,
  type FamilyRole,
  type PersonaType,
} from '../repositories/accounts-center.repository';

const PROFILE_KEY = ['accounts-center', 'profile'] as const;
const FAMILY_ID_KEY = ['accounts-center', 'family-id'] as const;
const familyMembersKey = (familyId: string) =>
  ['accounts-center', 'family-members', familyId] as const;
const familyRoleKey = (familyId: string) =>
  ['accounts-center', 'role', familyId] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
    // Keep the parent profile (incl. signed avatar URL) warm for the whole
    // session so opening Settings never has to cold-fetch it. See prefetchProfile.
    gcTime: Infinity,
  });
}

/**
 * Warm the parent profile into the query cache at auth recovery, so the Settings
 * screen renders the parent photo instantly instead of cold-fetching the profile
 * row + signing the private avatar URL on open (~1s). Mirrors how the child
 * profile query is already warm from the Profile tab. Fire-and-forget.
 */
export async function prefetchProfile(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
    gcTime: Infinity,
  });
  // Warm the avatar IMAGE bytes too, not just the query data. The parent photo
  // is only ever rendered on the Settings screen, so — unlike the child photo,
  // which Home/Profile already displayed and thus cached in expo-image — it still
  // downloads on first Settings open. Prefetch the current signed URL's bytes so
  // Settings shows it instantly, the same way Andrei's photo is already instant.
  const data = queryClient.getQueryData<{ avatarUrl: string | null }>(PROFILE_KEY);
  if (data?.avatarUrl) {
    void Image.prefetch(data.avatarUrl).catch(() => {});
  }
}

export function useFamilyIdQuery() {
  return useQuery({
    queryKey: FAMILY_ID_KEY,
    queryFn: fetchCurrentUserFamilyId,
  });
}

export function useFamilyMembersQuery(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyMembersKey(familyId ?? ''),
    queryFn: () => fetchFamilyMembers(familyId!),
    enabled: !!familyId,
  });
}

export function useCurrentUserRoleQuery(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyRoleKey(familyId ?? ''),
    queryFn: () => fetchCurrentUserRole(familyId!),
    enabled: !!familyId,
  });
}

export function useUpdateProfileInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      personaType,
    }: {
      name: string;
      personaType: PersonaType | null;
    }) => updateProfileInfo(name, personaType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      showToast('success', 'Changes saved.');
    },
  });
}

export function useUpdateEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      updateEmail(email, password),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      showToast('success', `Verification email sent to ${variables.email}. Check your inbox.`);
    },
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      showToast('success', 'Password updated.');
    },
  });
}

export function useUpdateProfilePhotoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (localUri: string) => {
      // uploadProfilePhoto now returns the storage path (avatars bucket is
      // private — see signAvatarUrl in the repo). The path lands in
      // profiles.avatar_url, and fetchProfile signs it on read.
      const storagePath = await uploadProfilePhoto(localUri);
      await updateProfilePhoto(storagePath);
      return storagePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      showToast('success', 'Changes saved.');
    },
    onError: () => {
      showToast('error', "Couldn't update photo. Please try again.");
    },
  });
}

export function useSendInviteMutation(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: FamilyRole }) =>
      sendInvite(familyId, email, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: familyMembersKey(familyId) });
      showToast('success', `Invite sent to ${variables.email}.`);
    },
  });
}

export function useChangeMemberRoleMutation(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: FamilyRole }) =>
      changeMemberRole(memberId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMembersKey(familyId) });
      showToast('success', 'Role updated.');
    },
  });
}

export function useRemoveFamilyMemberMutation(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeFamilyMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMembersKey(familyId) });
      showToast('success', 'Member removed.');
    },
  });
}
