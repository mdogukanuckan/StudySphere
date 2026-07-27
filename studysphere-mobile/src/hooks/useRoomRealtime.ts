
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { ROOM_QUERY_KEYS } from './useStudyRooms';

export const useJoinRoomChannel = (roomId: string) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('joinRoomChannel', roomId);
    return () => {
      socket.emit('leaveRoomChannel', roomId);
    };
  }, [socket, roomId]);
};

interface RoomRealtimeCallbacks {
  onSessionPauseChange?: (payload: { userId: string; isPaused: boolean }) => void;
  onRoomClosed?: () => void;
}

export const useRoomRealtimeEvents = (roomId: string, callbacks: RoomRealtimeCallbacks = {}) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!socket || !roomId) return;

    const invalidateParticipants = () => {
      queryClient.invalidateQueries({ queryKey: ['study-room-participants', roomId] });
      queryClient.invalidateQueries({ queryKey: ['studyRoom', roomId] });
    };

    const handleJoined = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) return;
      invalidateParticipants();
    };
    const handleLeft = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) return;
      invalidateParticipants();
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.all });
    };
    const handleStatusChanged = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) return;
      invalidateParticipants();
    };
    const handleSessionPaused = (payload: { roomId: string; userId: string }) => {
      if (payload.roomId !== roomId) return;
      invalidateParticipants();
      callbacksRef.current.onSessionPauseChange?.({ userId: payload.userId, isPaused: true });
    };
    const handleSessionResumed = (payload: { roomId: string; userId: string }) => {
      if (payload.roomId !== roomId) return;
      invalidateParticipants();
      callbacksRef.current.onSessionPauseChange?.({ userId: payload.userId, isPaused: false });
    };
    const handleRoomClosed = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) return;
      callbacksRef.current.onRoomClosed?.();
    };

    socket.on('participant:joined', handleJoined);
    socket.on('participant:left', handleLeft);
    socket.on('participant:statusChanged', handleStatusChanged);
    socket.on('session:paused', handleSessionPaused);
    socket.on('session:resumed', handleSessionResumed);
    socket.on('room:closed', handleRoomClosed);

    return () => {
      socket.off('participant:joined', handleJoined);
      socket.off('participant:left', handleLeft);
      socket.off('participant:statusChanged', handleStatusChanged);
      socket.off('session:paused', handleSessionPaused);
      socket.off('session:resumed', handleSessionResumed);
      socket.off('room:closed', handleRoomClosed);
    };
  }, [socket, roomId, queryClient]);
};
