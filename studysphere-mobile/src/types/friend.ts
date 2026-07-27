import { UnlockedAchievementSummary } from './studySession';
import { Achievement } from './achievement';

export type FriendPresence = 'STUDYING' | 'ON_BREAK' | 'ONLINE' | 'OFFLINE';
export type UserRelationship = 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export interface SafeUser {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
}

export interface Friend extends SafeUser {
    presence: FriendPresence;
}

export interface FriendRequest {
    id: string;
    createdAt: string;
    user: SafeUser;
}

export interface FriendRequestsResponse {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
}

export interface UserSearchResult extends SafeUser {
    relationship: UserRelationship;
}


export interface AcceptFriendRequestResponse {
    newAchievements?: UnlockedAchievementSummary[];
}

export interface FriendStats {
    totalStudyTime: number;
    totalSessionsCompleted: number;
    currentStreak: number;
    longestStreak: number;
}

export interface FriendProfile {
    user: SafeUser;
    stats: FriendStats | null;
    achievements: Achievement[];
}
