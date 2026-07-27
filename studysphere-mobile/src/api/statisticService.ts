import { DailyStat, ModeBreakdown, SubjectPerformance, UserStatistic } from "../types/statistics";
import apiClient from "./client";


export const statisticsService = {

    getMyStatistics: async (): Promise<UserStatistic> => {
        const response = await apiClient.get<UserStatistic>('/user-statistics/me');
        return response.data;
    },

    getDailyStats: async (): Promise<DailyStat[]> => {
        const response = await apiClient.get<DailyStat[]>('/user-statistics/daily-stats');
        return response.data;
    },

    getSubjectPerformance: async (userId: string): Promise<SubjectPerformance[]> => {
    const { data } = await apiClient.get<SubjectPerformance[]>(`/study-sessions/subject-performance/${userId}`);
    return data;
},

    // Solo (doğrudan konu seçilerek) ve sosyal (oda üzerinden) seanslardaki
    // toplam süre ve oturum sayısı kırılımı.
    getModeBreakdown: async (): Promise<ModeBreakdown> => {
        const response = await apiClient.get<ModeBreakdown>('/study-sessions/performance/mode');
        return response.data;
    },
}