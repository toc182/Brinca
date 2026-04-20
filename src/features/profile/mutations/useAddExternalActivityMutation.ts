import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { profileKeys } from '../queries/keys';
import { insertExternalActivity } from '../repositories/external-activity.repository';

interface AddExternalActivityInput {
  childId: string;
  name: string;
  schedule: string | null;
  location: string | null;
  notes: string | null;
}

export function useAddExternalActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ childId, name, schedule, location, notes }: AddExternalActivityInput) => {
      const id = randomUUID();
      await insertExternalActivity(id, childId, name, schedule, location, notes);
      return { id, childId };
    },
    onSuccess: ({ childId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.externalActivities(childId) });
    },
  });
}
