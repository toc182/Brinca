import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getOrCreateDrillResult, markDrillIncomplete } from '../repositories/drill-result.repository';
import { sessionKeys } from '../queries/keys';

interface UnmarkDrillCompleteInput {
  sessionId: string;
  drillId: string;
}

export function useUnmarkDrillCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, drillId }: UnmarkDrillCompleteInput) => {
      const drillResultId = await getOrCreateDrillResult(sessionId, drillId);
      await markDrillIncomplete(drillResultId);
      return { drillResultId };
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.drillResults(sessionId) });
    },
  });
}
