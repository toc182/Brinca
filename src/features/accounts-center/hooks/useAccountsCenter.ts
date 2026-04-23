import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/shared/utils/toast';
import {
  fetchProfile,
  fetchFamilyMembers,
  fetchCurrentUserFamilyId,
  fetchCurrentUserRole,
  updateDisplayName,
  updateEmail,
  updatePassword,
  uploadProfilePhoto,
  updateProfilePhoto,
  sendInvite,
  changeMemberRole,
  removeFamilyMember,
  type FamilyRole,
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
  });
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

export function useUpdateDisplayNameMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateDisplayName(name),
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
      const publicUrl = await uploadProfilePhoto(localUri);
      await updateProfilePhoto(publicUrl);
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      showToast('success', 'Changes saved.');
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
