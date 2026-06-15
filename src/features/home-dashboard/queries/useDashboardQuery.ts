import { useQuery } from '@tanstack/react-query';
import { refreshChildFromServer } from '@/lib/supabase/child-sync';
import { getDashboardData } from '../repositories/dashboard.repository';
import { homeKeys } from './keys';

export function useDashboardQuery(childId: string | null) {
  return useQuery({
    queryKey: homeKeys.dashboard(childId ?? ''),
    queryFn: async () => {
      // Refresh the child's name + photo from the server so they match
      // across devices (same behavior as the parent profile).
      await refreshChildFromServer(childId!);
      return getDashboardData(childId!);
    },
    enabled: !!childId,
  });
}
