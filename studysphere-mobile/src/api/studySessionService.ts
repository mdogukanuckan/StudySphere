import apiClient from './client';
import { StartSessionRequest, StudySession, StudyHistoryResponse, SessionType, EndSessionResponse } from '../types/studySession';

export interface EndSessionPayload {
  durationSeconds?: number;
  solvedQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
}

export const studySessionService = {
  startSession: async (data: StartSessionRequest): Promise<StudySession> => {
    const response = await apiClient.post<StudySession>('/study-sessions/start', data);
    return response.data;
  },
  endSession: async (sessionId: string, payload?: EndSessionPayload): Promise<EndSessionResponse> => {
    
    const response = await apiClient.patch<EndSessionResponse>(`/study-sessions/${sessionId}/end`, payload);
    return response.data;
  },

  cancelSession: async (sessionId: string): Promise<StudySession> => {
    const response = await apiClient.patch<StudySession>(`/study-sessions/${sessionId}/cancel`);
    return response.data;
  },

  pauseSession: async (sessionId: string): Promise<StudySession> => {
    const response = await apiClient.patch<StudySession>(`/study-sessions/${sessionId}/pause`);
    return response.data;
  },

  resumeSession: async (sessionId: string): Promise<StudySession> => {
    const response = await apiClient.patch<StudySession>(`/study-sessions/${sessionId}/resume`);
    return response.data;
  },
  getOngoingSession: async (): Promise<StudySession | null> => {
    const response = await apiClient.get<StudySession | null>('/study-sessions/active');
    return response.data;
  },
  getStudyHistory: async (params?: { sessionType?: SessionType; page?: number; limit?: number }): Promise<StudyHistoryResponse> => {
    const response = await apiClient.get<StudyHistoryResponse>(`/study-sessions/history`, { params });
    return response.data;
  },

 
  getSessionById: async (sessionId: string): Promise<StudySession> => {
    const response = await apiClient.get<StudySession>(`/study-sessions/${sessionId}`);
    return response.data;
  },

};