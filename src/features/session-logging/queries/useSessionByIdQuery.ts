import { useQuery } from '@tanstack/react-query';

import { getSessionById } from '../repositories/session.repository';
import { sessionKeys } from './keys';

export function useSessionByIdQuery(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.session(sessionId ?? ''),
    queryFn: () => getSessionById(sessionId!),
    enabled: !!sessionId,
  });
}
