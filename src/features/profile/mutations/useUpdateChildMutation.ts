import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isLocalAvatarUri, uploadChildAvatar } from '@/lib/supabase/avatar';
import { profileKeys } from '../queries/keys';
import { updateChild } from '../repositories/profile.repository';

interface UpdateChildInput {
  childId: string;
  fields: Partial<{
    name: string;
    date_of_birth: string;
    gender: string;
    country: string;
    grade_level: string;
    avatar_url: string;
    school_calendar: string;
    calendar_start_month: number | null;
    calendar_end_month: number | null;
  }>;
}

export function useUpdateChildMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ childId, fields }: UpdateChildInput) => {
      // A newly-picked photo arrives as a local file:// URI; upload it and store
      // the storage path instead (the local URI would vanish on reinstall).
      const next = { ...fields };
      if (isLocalAvatarUri(next.avatar_url)) {
        next.avatar_url = await uploadChildAvatar(next.avatar_url as string, childId);
      }
      await updateChild(childId, next);
      return { childId };
    },
    onSuccess: ({ childId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.child(childId) });
      // Also refresh the children-list query (the child switcher + accounts
      // center read it) so an updated photo/name appears immediately instead of
      // only after an app restart. Prefix-match covers every family id.
      queryClient.invalidateQueries({ queryKey: ['profile', 'children'] });
    },
  });
}
