import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateElement } from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';
import type { ElementWidth } from '@/shared/tracking-elements/types/element-types';

interface UpdateElementInput {
  elementId: string;
  drillId: string;
  fields: { label?: string; config?: Record<string, unknown>; width?: ElementWidth };
}

export function useUpdateElementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ elementId, fields }: UpdateElementInput) =>
      updateElement(elementId, fields),
    onSuccess: (_data, { drillId }) => {
      queryClient.invalidateQueries({
        queryKey: activityBuilderKeys.elements(drillId),
      });
    },
  });
}
