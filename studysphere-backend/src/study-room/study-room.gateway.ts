
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class StudyRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(StudyRoomGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  private getRoomChannel(roomId: string): string {
    return `study-room:${roomId}`;
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authToken = client.handshake.auth?.token as string | undefined;
      const headerToken = client.handshake.headers?.authorization
        ?.toString()
        .replace('Bearer ', '');
      const token = authToken || headerToken;

      if (!token) {
        throw new Error('Token gönderilmedi');
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
    } catch (error) {
      this.logger.warn(
        `Kimliği doğrulanamayan WebSocket bağlantısı reddedildi: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    
  }

  @SubscribeMessage('joinRoomChannel')
  handleJoinRoomChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() roomId: string,
  ) {
    if (!client.userId || !roomId) return;
    client.join(this.getRoomChannel(roomId));
  }

  @SubscribeMessage('leaveRoomChannel')
  handleLeaveRoomChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() roomId: string,
  ) {
    if (!roomId) return;
    client.leave(this.getRoomChannel(roomId));
  }

  emitParticipantJoined(roomId: string, userId: string) {
    this.server.to(this.getRoomChannel(roomId)).emit('participant:joined', { roomId, userId });
  }

  emitParticipantLeft(roomId: string, userId: string, kicked: boolean) {
    this.server
      .to(this.getRoomChannel(roomId))
      .emit('participant:left', { roomId, userId, kicked });
  }

  emitParticipantStatusChanged(roomId: string, userId: string, currentStatus: string) {
    this.server
      .to(this.getRoomChannel(roomId))
      .emit('participant:statusChanged', { roomId, userId, currentStatus });
  }

  emitSessionPauseChanged(roomId: string, userId: string, sessionId: string, isPaused: boolean) {
    this.server
      .to(this.getRoomChannel(roomId))
      .emit(isPaused ? 'session:paused' : 'session:resumed', { roomId, userId, sessionId });
  }

  
  emitRoomClosed(roomId: string) {
    this.server.to(this.getRoomChannel(roomId)).emit('room:closed', { roomId });
  }
}
