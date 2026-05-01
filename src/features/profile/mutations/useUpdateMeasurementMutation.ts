import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '../queries/keys';
import { updateMeasurement } from '../repositories/measurement.repository';

interface UpdateMeasurementInput {
  id: string;
  childId: string;
  value: number;
  date: string;
}

export function useUpdateMeasurementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value, date }: UpdateMeasurementInput) => {
      await updateMeasurement(id, value, date);
    },
    onSuccess: (_data, { childId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.measurements(childId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.child(childId) });
    },
  });
}
