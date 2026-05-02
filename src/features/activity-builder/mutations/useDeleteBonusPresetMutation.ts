import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteBonusPreset } from '../repositories/bonus-preset.repository';
import { activityBuilderKeys } from '../queries/keys';

interface DeleteBonusPresetInput {
  id: string;
  parentType: 'activity' | 'drill';
  parentId: string;
}

export function useDeleteBonusPresetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteBonusPresetInput) => deleteBonusPreset(id),
    onSuccess: (_data, { parentType, parentId }) => {
      queryClient.invalidateQueries({
        queryKey: activityBuilderKeys.bonusPresets(parentType, parentId),
      });
    },
  });
}
