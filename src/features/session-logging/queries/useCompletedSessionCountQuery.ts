import { useQuery } from '@tanstack/react-query';

import { getCompletedSessionCount } from '../repositories/session.repository';

export function useCompletedSessionCountQuery(childId: string | null) {
  return useQuery({
    queryKey: ['session-count', childId ?? ''],
    queryFn: () => getCompletedSessionCount(childId!),
    enabled: !!childId,
  });
}
