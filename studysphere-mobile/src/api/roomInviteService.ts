import apiClient from './client';
import { RoomInvite } from '../types/studyRoom';

export const roomInviteService = {
  getMyInvites: async (): Promise<RoomInvite[]> => {
    const { data } = await apiClient.get<RoomInvite[]>('/room-invites/me');
    return data;
  },

  acceptInvite: async (inviteId: string): Promise<void> => {
    await apiClient.post(`/room-invites/${inviteId}/accept`);
  },

  declineInvite: async (inviteId: string): Promise<void> => {
    await apiClient.post(`/room-invites/${inviteId}/decline`);
  },
};
