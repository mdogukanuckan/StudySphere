import { DailyStat, ModeBreakdown, SubjectBreakdown, UserStatistic } from "../types/statistics";
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

    getSubjectPerformance: async (): Promise<SubjectBreakdown[]> => {
        const { data } = await apiClient.get<SubjectBreakdown[]>('/study-sessions/performance/subjects');
        return data;
    },

    getModeBreakdown: async (): Promise<ModeBreakdown> => {
        const response = await apiClient.get<ModeBreakdown>('/study-sessions/performance/mode');
        return response.data;
    },
}
