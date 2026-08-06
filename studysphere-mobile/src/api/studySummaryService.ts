import apiClient from './client';

export type StudySummaryPeriod = 'weekly' | 'monthly' | 'cumulative';

export interface StudySummarySendResult {
    period: StudySummaryPeriod;
    periodLabel: string;
    sessionCount: number;
    hasData: boolean;
    sentTo: string;
}

export const studySummaryService = {
    sendReport: async (period: StudySummaryPeriod): Promise<StudySummarySendResult> => {
        const { data } = await apiClient.post<StudySummarySendResult>('/study-summary/send', { period });
        return data;
    },
};
