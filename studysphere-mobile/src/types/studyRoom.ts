import { z } from 'zod';

export interface StudyRoom {
  id: string;
  title: string;
  description?: string;
  universe: { id: string; name: string };
  subject: { id: string; name: string };
  topic?: { id: string; name: string };
  maxParticipants: number;
  currentParticipants: number;
  ownerId: string;
  owner?: { id: string; username: string };
  isPrivate: boolean;
  // Sadece isPrivate=true odalarda, ve sadece backend'in döndürdüğü kadarıyla
  // dolu (bkz. study-room.entity.ts#inviteCode) — 6 haneli davet kodu.
  inviteCode?: string | null;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  participants?: Participant[];
}

export interface RoomInvite {
  id: string;
  createdAt: string;
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
export interface Participant {
  id: string;
  username: string;
  avatarUrl?: string;
  isOwner: boolean;
  isOnline: boolean;
  currentStatus: 'WORKING' | 'BREAK';
  joinedAt: string;
  isSessionPaused?: boolean;
}

export interface CreateRoomDto {
  title: string;
  description?: string;
  universeId: string;
  subjectId: string;
  topicId?: string;
  maxParticipants: number;
  isPrivate: boolean;
}

export const createRoomSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().optional(),
  universeId: z.string().min(1, 'Evren seçimi zorunludur'),
  subjectId: z.string().min(1, 'Ders seçimi zorunludur'),
  topicId: z.string().optional(), 
  maxParticipants: z.number().min(2, 'En az 2 katılımcı olmalıdır').max(50, 'En fazla 50 olabilir'),
  isPrivate: z.boolean().default(false),
});

export const updateRoomSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().optional(),
  maxParticipants: z.number().min(2).max(50),
  isClosed: z.boolean().default(false),
});

export type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
export type UpdateRoomFormValues = z.infer<typeof updateRoomSchema>;