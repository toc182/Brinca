import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getOrCreateDrillResult, markDrillComplete } from '../repositories/drill-result.repository';
import { sessionKeys } from '../queries/keys';

interface MarkDrillCompleteInput {
  sessionId: string;
  drillId: string;
}

export function useMarkDrillCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, drillId }: MarkDrillCompleteInput) => {
      const drillResultId = await getOrCreateDrillResult(sessionId, drillId);
      await markDrillComplete(drillResultId);
      return { drillResultId };
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.drillResults(sessionId) });
    },
  });
}
