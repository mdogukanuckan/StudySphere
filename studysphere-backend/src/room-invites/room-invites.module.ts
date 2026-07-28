import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomInvite } from './entities/room-invite.entity';
import { RoomParticipant } from '../study-room/entities/room-participant.entity';
import { Friendship } from '../friends/entities/friendship.entity';
import { RoomInvitesService } from './room-invites.service';
import { RoomInvitesController } from './room-invites.controller';
import { StudyRoomsModule } from '../study-room/study-room.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomInvite, RoomParticipant, Friendship]),
    StudyRoomsModule,
    UsersModule,
  ],
  controllers: [RoomInvitesController],
  providers: [RoomInvitesService],
})
export class RoomInvitesModule {}
