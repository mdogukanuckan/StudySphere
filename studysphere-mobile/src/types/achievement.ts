
export type AchievementCategory = 'TOTAL_QUESTIONS' | 'TOTAL_CORRECT' | 'ERRORLESS_SESSIONS' | 'STUDY_TIME' | 'STREAK' | 'SOCIAL_STUDY_TIME' | 'FRIEND_COUNT' | 'ROOM_CREATION_COUNT' | 'SUBJECT_DIVERSITY';

export interface Achievement {
    key: string;
    category: AchievementCategory;
    title: string;
    description: string;
    icon: string;
    threshold: number;
    progress: number;
    target: number;
    unlocked: boolean;
    unlockedAt: string | null;
}
