import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../api/sessionService';

const SESSIONS_QUERY_KEY = ['authSessions'];

export const useMySessions = () => {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: sessionService.getMySessions,
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionService.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
};
