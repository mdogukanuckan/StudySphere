
export interface UserStatistic{

    id : string;
    totalStudyTime : number;
    totalSessionsCompleted : number;
    currentStreak : number;
    longestStreak : number;
    totalCorrectQuestions : number;
    totalIncorrectQuestions : number;
    lastStudyDate : string | null;
}

export interface DailyStat {
    date : string;
    totalDuration : string | number;
}

export interface TopicBreakdown {
    topicId: string | null;
    topicName: string;
    totalDuration: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    sessionCount: number;
}

export interface SubjectBreakdown {
    subjectId: string;
    subjectName: string;
    totalDuration: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    sessionCount: number;
    topics: TopicBreakdown[];
}


export interface ModeBreakdownEntry {
    totalDuration: number;
    sessionCount: number;
}

export interface ModeBreakdown {
    solo: ModeBreakdownEntry;
    social: ModeBreakdownEntry;
}
