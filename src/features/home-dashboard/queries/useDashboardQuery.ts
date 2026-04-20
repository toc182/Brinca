import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '../repositories/dashboard.repository';
import { homeKeys } from './keys';

export function useDashboardQuery(childId: string | null) {
  return useQuery({
    queryKey: homeKeys.dashboard(childId ?? ''),
    queryFn: () => getDashboardData(childId!),
    enabled: !!childId,
  });
}
