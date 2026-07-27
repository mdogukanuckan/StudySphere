import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StudyRoom } from './entities/study-room.entity';
import { RoomParticipant } from './entities/room-participant.entity';
import { StudyRoomsController } from './study-room.controller';
import { StudyRoomService } from './study-room.service';
import { StudyRoomGateway } from './study-room.gateway';
import { StudySession } from '../study-sessions/entities/study-session.entity';

@Module({
  imports: [
    // StudySession: getRoomParticipants()'da bir katılımcının kronometresinin
    // şu an duraklatılmış olup olmadığını (isSessionPaused) kontrol edebilmek
    // için eklendi — sadece entity import ediliyor, StudySessionsModule'e
    // bağımlılık yok (döngüsel bağımlılık riski almadan).
    TypeOrmModule.forFeature([StudyRoom, RoomParticipant, StudySession]),
    // WebSocket bağlantılarını doğrulamak için AuthModule'dekiyle AYNI
    // JWT_SECRET'ı kullanan bağımsız bir JwtModule kaydı — AuthModule'ü
    // buraya import edip döngüsel bağımlılık riski almak yerine (AuthModule
    // zaten UsersModule/RefreshTokensModule'e bağlı), sadece token doğrulamak
    // için gereken JwtService'i burada ayrıca kaydediyoruz.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StudyRoomsController],
  providers: [StudyRoomService, StudyRoomGateway],
  // StudyRoomGateway export edildi: StudySessionsModule bunu enjekte edip
  // kronometre duraklat/devam olaylarını aynı odadaki katılımcılara yayınlıyor
  // (bkz. study-sessions.service.ts).
  exports: [StudyRoomService, StudyRoomGateway],
})
export class StudyRoomsModule {}