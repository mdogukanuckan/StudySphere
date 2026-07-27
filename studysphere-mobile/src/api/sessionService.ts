import apiClient from './client';
import { AuthSession } from '../types/session';

export const sessionService = {
  getMySessions: async (): Promise<AuthSession[]> => {
    const response = await apiClient.get<AuthSession[]>('/refresh-tokens/my-sessions');
    return response.data;
  },

  revokeSession: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/refresh-tokens/${id}`);
    return response.data;
  },
};
