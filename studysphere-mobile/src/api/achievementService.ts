import apiClient from './client';
import { Achievement } from '../types/achievement';

export const achievementService = {
    getMine: async (): Promise<Achievement[]> => {
        const response = await apiClient.get<Achievement[]>('/achievements/me');
        return response.data;
    },
};
