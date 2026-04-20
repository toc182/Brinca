import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { insertDrillResult, markDrillComplete, insertElementValue, updateElementValue } from '../repositories/drill-result.repository';

export function useLogDrillMutation() {
  return useMutation({
    mutationFn: async ({ sessionId, drillId, elements }: {
      sessionId: string;
      drillId: string;
      elements: { trackingElementId: string; value: Record<string, unknown> }[];
    }) => {
      const drillResultId = randomUUID();
      await insertDrillResult(drillResultId, sessionId, drillId);

      for (const el of elements) {
        const elementValueId = randomUUID();
        await insertElementValue(elementValueId, drillResultId, el.trackingElementId, el.value);
      }

      await markDrillComplete(drillResultId);
      return { drillResultId };
    },
  });
}
