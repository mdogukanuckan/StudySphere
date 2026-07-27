import apiClient from './client';
import { AcceptFriendRequestResponse, Friend, FriendProfile, FriendRequestsResponse, UserSearchResult } from '../types/friend';

export const friendService = {
    search: async (query: string): Promise<UserSearchResult[]> => {
        const response = await apiClient.get<UserSearchResult[]>('/friends/search', { params: { query } });
        return response.data;
    },

    getFriends: async (): Promise<Friend[]> => {
        const response = await apiClient.get<Friend[]>('/friends');
        return response.data;
    },

    getPendingRequests: async (): Promise<FriendRequestsResponse> => {
        const response = await apiClient.get<FriendRequestsResponse>('/friends/requests');
        return response.data;
    },

    sendRequest: async (addresseeId: string): Promise<void> => {
        await apiClient.post('/friends/requests', { addresseeId });
    },

    acceptRequest: async (requestId: string): Promise<AcceptFriendRequestResponse> => {
        const response = await apiClient.post<AcceptFriendRequestResponse>(`/friends/requests/${requestId}/accept`);
        return response.data;
    },

    rejectRequest: async (requestId: string): Promise<void> => {
        await apiClient.post(`/friends/requests/${requestId}/reject`);
    },

    removeFriend: async (userId: string): Promise<void> => {
        await apiClient.delete(`/friends/${userId}`);
    },

    getFriendProfile: async (userId: string): Promise<FriendProfile> => {
        const response = await apiClient.get<FriendProfile>(`/friends/${userId}`);
        return response.data;
    },
};
