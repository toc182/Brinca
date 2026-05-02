import { useQuery } from '@tanstack/react-query';

import { getDrillResultsBySession } from '../repositories/drill-result.repository';
import { sessionKeys } from './keys';

export function useDrillResultsQuery(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.drillResults(sessionId ?? ''),
    queryFn: () => getDrillResultsBySession(sessionId!),
    enabled: !!sessionId,
  });
}
