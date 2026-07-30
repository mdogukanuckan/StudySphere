import apiClient from './client';

export const deviceService = {
    registerPushToken: async (deviceId: string, token: string): Promise<void> => {
        await apiClient.patch('/devices/push-token', { deviceId, token });
    },
};
