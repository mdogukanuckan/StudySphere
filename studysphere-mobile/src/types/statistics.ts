
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

  export interface SubjectPerformance {
    subjectId: string;
    totalDuration: number;
}


export interface ModeBreakdownEntry {
    totalDuration: number;
    sessionCount: number;
}

export interface ModeBreakdown {
    solo: ModeBreakdownEntry;
    social: ModeBreakdownEntry;
}