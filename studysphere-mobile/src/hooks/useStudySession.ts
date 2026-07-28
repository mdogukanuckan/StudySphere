import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studySessionService, EndSessionPayload } from '../api/studySessionService';
import { StartSessionRequest, SessionType } from '../types/studySession';

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartSessionRequest) => studySessionService.startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ongoingSession'] });
    }
  });
};

export const useEndSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...payload }: { sessionId: string } & EndSessionPayload) =>
      studySessionService.endSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ongoingSession'] });
      queryClient.invalidateQueries({ queryKey: ['studyHistory'] });
      queryClient.invalidateQueries({ queryKey: ['my-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });

      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    }
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => studySessionService.cancelSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ongoingSession'] });
    }
  });
};

export const usePauseSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => studySessionService.pauseSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ongoingSession'] });
    }
  });
};

export const useResumeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => studySessionService.resumeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ongoingSession'] });
    }
  });
};

export const useOngoingSession = () => {
  return useQuery({
    queryKey: ['ongoingSession'],
    queryFn: studySessionService.getOngoingSession,
    staleTime: 0, 
  }); 
};

export const useStudyHistory = (sessionType?: SessionType, limit: number = 20) => {
  return useQuery({
    queryKey: ['studyHistory', sessionType ?? 'ALL', limit],
    queryFn: () => studySessionService.getStudyHistory({ sessionType, limit }),
  });
};

export const useSessionDetail = (sessionId: string) => {
  return useQuery({
    queryKey: ['studySessionDetail', sessionId],
    queryFn: () => studySessionService.getSessionById(sessionId),
    enabled: !!sessionId,
  });
};