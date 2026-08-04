import { DailyStat, ModeBreakdown, UniverseBreakdown, UserStatistic } from "../types/statistics";
import apiClient from "./client";

export type SubjectPerformanceRange = 'week' | 'month';

export const statisticsService = {

    getMyStatistics: async (): Promise<UserStatistic> => {
        const response = await apiClient.get<UserStatistic>('/user-statistics/me');
        return response.data;
    },

    getDailyStats: async (): Promise<DailyStat[]> => {
        const response = await apiClient.get<DailyStat[]>('/user-statistics/daily-stats');
        return response.data;
    },

    getSubjectPerformance: async (range?: SubjectPerformanceRange): Promise<UniverseBreakdown[]> => {
        const { data } = await apiClient.get<UniverseBreakdown[]>('/study-sessions/performance/subjects', {
            params: range ? { range } : undefined,
        });
        return data;
    },

    getModeBreakdown: async (): Promise<ModeBreakdown> => {
        const response = await apiClient.get<ModeBreakdown>('/study-sessions/performance/mode');
        return response.data;
    },
}
