import apiClient from './client';
import { CurrentUser, UpdateProfileRequest } from '../types/user';

export const userService = {
    getMe: async (): Promise<CurrentUser> => {
        const response = await apiClient.get<CurrentUser>('/users/me');
        return response.data;
    },

    updateMe: async (data: UpdateProfileRequest): Promise<CurrentUser> => {
        const response = await apiClient.patch<CurrentUser>('/users/me', data);
        return response.data;
    },

    ping: async (): Promise<void> => {
        await apiClient.patch('/users/me/ping');
    },
};
