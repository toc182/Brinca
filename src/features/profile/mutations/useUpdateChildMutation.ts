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
