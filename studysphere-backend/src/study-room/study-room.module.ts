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
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyRoom, RoomParticipant, StudySession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [StudyRoomsController],
  providers: [StudyRoomService, StudyRoomGateway],
  exports: [StudyRoomService, StudyRoomGateway],
})
export class StudyRoomsModule {}