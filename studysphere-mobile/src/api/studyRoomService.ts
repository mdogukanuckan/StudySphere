import { StudyRoom, CreateRoomDto, Participant } from "../types/studyRoom";
import apiClient from "./client";

export const studyRoomApi = {
  getRooms: async (): Promise<StudyRoom[]> => {
    const { data } = await apiClient.get('/study-rooms');
    return data;
  },
  
  getRoomById: async (id: string): Promise<StudyRoom> => {
    const { data } = await apiClient.get(`/study-rooms/${id}`);
    return data;
  },

  createRoom: async (payload: CreateRoomDto): Promise<StudyRoom> => {
    const { data } = await apiClient.post('/study-rooms', payload);
    return data;
  },

  joinRoom: async (roomId: string): Promise<void> => {
    await apiClient.post(`/study-rooms/${roomId}/join`);
  },

  joinRoomByCode: async (code: string): Promise<{ roomId: string }> => {
    const { data } = await apiClient.post('/study-rooms/join-by-code', { code });
    return { roomId: data.roomId };
  },

  inviteFriendToRoom: async (roomId: string, friendUserId: string): Promise<void> => {
    await apiClient.post(`/study-rooms/${roomId}/invites`, { friendUserId });
  },

  getRoomParticipants: async (roomId: string): Promise<Participant[]> => {
    const { data } = await apiClient.get(`/study-rooms/${roomId}/participants`);
    return data;
  },

  kickParticipant: async (roomId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/study-rooms/${roomId}/participants/${userId}`);
  },

  updateMyStatus: async (roomId: string, status: 'WORKING' | 'BREAK'): Promise<void> => {
    await apiClient.patch(`/study-rooms/${roomId}/status`, { status });
  },
};