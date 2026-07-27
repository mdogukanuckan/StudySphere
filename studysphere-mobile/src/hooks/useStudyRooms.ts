import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyRoomApi } from '../api/studyRoomService';
import { CreateRoomDto, CreateRoomFormValues, StudyRoom, UpdateRoomFormValues } from '../types/studyRoom';
import apiClient from '../api/client';

export const ROOM_QUERY_KEYS = {
  all: ['study-rooms'] as const,
};

export const useGetRooms = () => {
  return useQuery({
    queryKey: ROOM_QUERY_KEYS.all,
    queryFn: studyRoomApi.getRooms,
  });
};

export const useRoomParticipants = (roomId: string) => {
  return useQuery({
    queryKey: ['study-room-participants', roomId],
    queryFn: () => studyRoomApi.getRoomParticipants(roomId),
    enabled: !!roomId,
  });
};

export const useKickParticipant = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => studyRoomApi.kickParticipant(roomId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-room-participants', roomId] });
      queryClient.invalidateQueries({ queryKey: ['studyRoom', roomId] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    },
  });
};

export const useUpdateMyStatus = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: 'WORKING' | 'BREAK') => studyRoomApi.updateMyStatus(roomId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-room-participants', roomId] });
    },
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomDto) => studyRoomApi.createRoom(payload),
    onSuccess: () => {
      // Yeni oda kurulunca listeyi invalidate edip yeniden çektiriyoruz
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    },
  });
};



const getRoomDetails = async (roomId: string): Promise<StudyRoom> => {
  const response = await apiClient.get(`/study-rooms/${roomId}`);
  return response.data;
};

const joinRoom = async (roomId: string) => apiClient.post(`/study-rooms/${roomId}/join`);
const leaveRoom = async (roomId: string) => apiClient.post(`/study-rooms/${roomId}/leave`);
const updateRoom = async (roomId: string, data: UpdateRoomFormValues) => {
  const { isClosed, ...rest } = data;
  return apiClient.patch(`/study-rooms/${roomId}`, rest);
};
const closeRoomRequest = async (roomId: string) => apiClient.patch(`/study-rooms/${roomId}/close`);



export const useRoomDetails = (roomId: string) => {
  return useQuery({
    queryKey: ['studyRoom', roomId],
    queryFn: () => getRoomDetails(roomId),
    enabled: !!roomId,
  });
};

export const useJoinRoom = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => joinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyRoom', roomId] });
      queryClient.invalidateQueries({ queryKey: ['study-room-participants', roomId] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    },
  });
};

export const useLeaveRoom = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyRoom', roomId] });
      queryClient.invalidateQueries({ queryKey: ['study-room-participants', roomId] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    },
  });
};
export const useUpdateRoom = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRoomFormValues) => updateRoom(roomId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studyRoom', roomId] }),
  });
};

export const useCloseRoom = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeRoomRequest(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyRoom', roomId] });
      queryClient.invalidateQueries({ queryKey: ['study-room-participants', roomId] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    },
  });
};