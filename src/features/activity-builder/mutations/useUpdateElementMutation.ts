import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateElement } from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';

interface UpdateElementInput {
  elementId: string;
  drillId: string;
  fields: { label?: string; config?: Record<string, unknown> };
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
