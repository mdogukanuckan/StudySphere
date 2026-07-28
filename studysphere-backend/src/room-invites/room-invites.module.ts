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
    // RoomParticipant ve Friendship: sadece entity olarak import edildi
    // (FriendsModule/StudyRoomsModule'ün TAMAMINA bağımlı olmadan) — aynı
    // "döngüsel bağımlılık riski almadan sadece entity" deseni
    // study-room.module.ts'teki StudySession importunda da kullanılıyor.
    TypeOrmModule.forFeature([RoomInvite, RoomParticipant, Friendship]),
    // StudyRoomService: davet kabul edilince gerçek katılma mantığını
    // (kapasite/kilit/"tek aktif oda" kontrolü) tekrarlamadan yeniden
    // kullanmak için.
    StudyRoomsModule,
    // EmailVerifiedGuard (davet kabul etme ucunda) UsersService'e ihtiyaç duyuyor.
    UsersModule,
  ],
  controllers: [RoomInvitesController],
  providers: [RoomInvitesService],
})
export class RoomInvitesModule {}
