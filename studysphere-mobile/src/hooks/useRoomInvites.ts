import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomInviteService } from '../api/roomInviteService';
import { ROOM_QUERY_KEYS } from './useStudyRooms';

export const ROOM_INVITES_QUERY_KEY = ['room-invites', 'me'];

export const useMyRoomInvites = () => {
  return useQuery({
    queryKey: ROOM_INVITES_QUERY_KEY,
    queryFn: roomInviteService.getMyInvites,
    refetchInterval: 30_000,
  });
};

export const useAcceptRoomInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => roomInviteService.acceptInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOM_INVITES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    },
  });
};

export const useDeclineRoomInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => roomInviteService.declineInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOM_INVITES_QUERY_KEY });
    },
  });
};
