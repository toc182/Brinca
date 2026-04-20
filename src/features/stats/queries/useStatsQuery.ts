import { useQuery } from '@tanstack/react-query';
import { getStatsSummary, getSessionList } from '../repositories/stats.repository';
import { statsKeys } from './keys';

export function useStatsQuery(childId: string | null) {
  return useQuery({
    queryKey: statsKeys.summary(childId ?? ''),
    queryFn: () => getStatsSummary(childId!),
    enabled: !!childId,
  });
}

export function useSessionListQuery(childId: string | null) {
  return useQuery({
    queryKey: statsKeys.sessionList(childId ?? ''),
    queryFn: () => getSessionList(childId!),
    enabled: !!childId,
  });
}
