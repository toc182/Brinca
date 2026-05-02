import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateSessionNote } from '../repositories/session.repository';
import { sessionKeys } from '../queries/keys';

interface UpdateSessionNoteInput {
  sessionId: string;
  note: string;
}

export function useUpdateSessionNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, note }: UpdateSessionNoteInput) =>
      updateSessionNote(sessionId, note),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.session(sessionId) });
    },
  });
}
