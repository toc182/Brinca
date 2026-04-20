import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import type { MeasurementType } from '@/types/domain.types';
import { profileKeys } from '../queries/keys';
import { insertMeasurement } from '../repositories/measurement.repository';

interface AddMeasurementInput {
  childId: string;
  type: MeasurementType;
  value: number;
  date: string;
}

export function useAddMeasurementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ childId, type, value, date }: AddMeasurementInput) => {
      const id = randomUUID();
      await insertMeasurement(id, childId, type, value, date);
      return { id, childId };
    },
    onSuccess: ({ childId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.measurements(childId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.child(childId) });
    },
  });
}
