import { useQuery } from '@tanstack/react-query';

import { getDrillResultsWithDrillNames } from '../repositories/drill-result.repository';

export function useDrillResultsWithNamesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ['drill-results-with-names', sessionId ?? ''],
    queryFn: () => getDrillResultsWithDrillNames(sessionId!),
    enabled: !!sessionId,
  });
}
