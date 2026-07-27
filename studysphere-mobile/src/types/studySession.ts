
export type SessionType = 'POMODORO' | 'FREE'
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'CANCELLED'

export interface StartSessionRequest {
    topicId : string;
    sessionType : string;
    roomId ?: string;
    plannedDurationSeconds ?: number;
}

export interface NamedEntityRef {
    id : string;
    name : string;
}

export interface StudySession {
    id : string;
    userId : string;
    topicId : string;
    sessionType : SessionType;
    sessionStatus : SessionStatus;
    startTime ?: string;
    createdAt : string;
    endTime : string;
    plannedDurationSeconds ?: number | null;
    questionCount ?: number;
    correctCount ?: number;
    wrongCount ?: number;
    goal ?: string | null;
    topic ?: NamedEntityRef | null;
    subject ?: NamedEntityRef;
    universe ?: NamedEntityRef;
}

export interface StudyHistoryResponse {
    data: StudySession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface UnlockedAchievementSummary {
    key: string;
    title: string;
    description: string;
    icon: string;
}

export interface EndSessionResponse extends StudySession {
    newAchievements?: UnlockedAchievementSummary[];
}