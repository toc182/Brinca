import { useQuery } from '@tanstack/react-query';

import { getBonusesBySession } from '../repositories/currency-ledger.repository';
import { sessionKeys } from './keys';

export function useSessionBonusesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.sessionBonuses(sessionId ?? ''),
    queryFn: () => getBonusesBySession(sessionId!),
    enabled: !!sessionId,
  });
}
