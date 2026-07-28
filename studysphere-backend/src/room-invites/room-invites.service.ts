import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RoomInvite } from "./entities/room-invite.entity";
import { RoomInviteStatus } from "./enums/room-invite-status.enum";
import { RoomParticipant } from "../study-room/entities/room-participant.entity";
import { Friendship } from "../friends/entities/friendship.entity";
import { FriendshipStatus } from "../friends/enums/friendship-status.enum";
import { RoomStatus } from "../study-room/enums/room-status.enum";
import { StudyRoomService } from "../study-room/study-room.service";

export interface MyRoomInviteView {
    id: string;
    createdAt: Date;
    fromUser: { id: string; username: string };
    room: {
        id: string;
        title: string;
        currentParticipants: number;
        maxParticipants: number;
        subject: { id: string; name: string } | null;
        universe: { id: string; name: string } | null;
    };
}

@Injectable()
export class RoomInvitesService {
    constructor(
        @InjectRepository(RoomInvite)
        private readonly roomInviteRepository: Repository<RoomInvite>,
        @InjectRepository(RoomParticipant)
        private readonly participantRepository: Repository<RoomParticipant>,
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        private readonly studyRoomService: StudyRoomService,
    ) { }

    private async areFriends(userAId: string, userBId: string): Promise<boolean> {
        const relationship = await this.friendshipRepository.findOne({
            where: [
                { requesterId: userAId, addresseeId: userBId, status: FriendshipStatus.ACCEPTED },
                { requesterId: userBId, addresseeId: userAId, status: FriendshipStatus.ACCEPTED },
            ],
        });
        return !!relationship;
    }

    async sendInvite(fromUserId: string, roomId: string, toUserId: string): Promise<RoomInvite> {
        if (fromUserId === toUserId) {
            throw new BadRequestException('Kendine davet gönderemezsin.');
        }

        const room = await this.studyRoomService.getRoom(roomId);
        if (room.status !== RoomStatus.ACTIVE) {
            throw new BadRequestException('Kapalı bir odaya davet gönderilemez.');
        }

        const senderParticipant = await this.participantRepository.findOne({
            where: { roomId, userId: fromUserId, isActive: true },
        });
        if (!senderParticipant) {
            throw new ForbiddenException('Davet gönderebilmek için bu odada aktif olmanız gerekiyor.');
        }

        const isFriend = await this.areFriends(fromUserId, toUserId);
        if (!isFriend) {
            throw new ForbiddenException('Sadece arkadaşlarınızı bir çalışma odasına davet edebilirsiniz.');
        }

        const targetAlreadyIn = await this.participantRepository.findOne({
            where: { roomId, userId: toUserId, isActive: true },
        });
        if (targetAlreadyIn) {
            throw new ConflictException('Arkadaşın zaten bu odada.');
        }

        try {
            const invite = this.roomInviteRepository.create({
                roomId,
                fromUserId,
                toUserId,
                status: RoomInviteStatus.PENDING,
            });
            return await this.roomInviteRepository.save(invite);
        } catch (error: any) {
            if (error?.code === '23505' || error?.driverError?.code === '23505') {
                throw new ConflictException('Bu arkadaşa bu oda için zaten bekleyen bir davet var.');
            }
            throw error;
        }
    }

    async getMyInvites(userId: string): Promise<MyRoomInviteView[]> {
        const invites = await this.roomInviteRepository.createQueryBuilder('invite')
            .leftJoinAndSelect('invite.room', 'room')
            .leftJoin('invite.fromUser', 'fromUser')
            .addSelect(['fromUser.id', 'fromUser.username'])
            .leftJoinAndSelect('room.subject', 'subject')
            .leftJoinAndSelect('room.universe', 'universe')
            .where('invite.toUserId = :userId', { userId })
            .andWhere('invite.status = :status', { status: RoomInviteStatus.PENDING })
            .andWhere('room.status = :roomStatus', { roomStatus: RoomStatus.ACTIVE })
            .orderBy('invite.createdAt', 'DESC')
            .getMany();

        return invites.map((invite) => ({
            id: invite.id,
            createdAt: invite.createdAt,
            fromUser: { id: invite.fromUser.id, username: invite.fromUser.username },
            room: {
                id: invite.room.id,
                title: invite.room.title,
                currentParticipants: invite.room.currentParticipants,
                maxParticipants: invite.room.maxParticipants,
                subject: invite.room.subject ? { id: invite.room.subject.id, name: invite.room.subject.name } : null,
                universe: invite.room.universe ? { id: invite.room.universe.id, name: invite.room.universe.name } : null,
            },
        }));
    }

    private async findOwnedPendingInvite(userId: string, inviteId: string): Promise<RoomInvite> {
        const invite = await this.roomInviteRepository.findOne({ where: { id: inviteId } });
        if (!invite || invite.toUserId !== userId) {
            throw new NotFoundException('Davet bulunamadı.');
        }
        if (invite.status !== RoomInviteStatus.PENDING) {
            throw new ConflictException('Bu davet zaten yanıtlanmış.');
        }
        return invite;
    }

    async acceptInvite(userId: string, inviteId: string): Promise<void> {
        const invite = await this.findOwnedPendingInvite(userId, inviteId);
        await this.studyRoomService.joinRoom(userId, invite.roomId);
        invite.status = RoomInviteStatus.ACCEPTED;
        invite.respondedAt = new Date();
        await this.roomInviteRepository.save(invite);
    }

    async declineInvite(userId: string, inviteId: string): Promise<void> {
        const invite = await this.findOwnedPendingInvite(userId, inviteId);
        invite.status = RoomInviteStatus.DECLINED;
        invite.respondedAt = new Date();
        await this.roomInviteRepository.save(invite);
    }
}
