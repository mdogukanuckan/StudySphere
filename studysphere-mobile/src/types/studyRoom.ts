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
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  participants?: Participant[];  
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