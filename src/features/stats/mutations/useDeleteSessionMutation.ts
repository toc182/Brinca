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
      // The chart reads ['stats-chart']; without this it kept showing the
      // deleted session. ['stats-activities'] drives the filter chips, which can
      // also change when a session (and possibly an activity's only data) goes.
      queryClient.invalidateQueries({ queryKey: ['stats-chart'] });
      queryClient.invalidateQueries({ queryKey: ['stats-activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
