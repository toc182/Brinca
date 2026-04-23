import { useMutation, useQueryClient } from '@tanstack/react-query';

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
      await updateChild(childId, fields);
      return { childId };
    },
    onSuccess: ({ childId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.child(childId) });
    },
  });
}
