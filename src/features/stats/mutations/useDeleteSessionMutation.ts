import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSession } from '../repositories/stats.repository';
import { statsKeys } from '../queries/keys';

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      await deleteSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats-summary'] });
      queryClient.invalidateQueries({ queryKey: ['session-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
