import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendService } from '../api/friendService';

export const FRIENDS_QUERY_KEY = ['friends'];
export const FRIEND_REQUESTS_QUERY_KEY = ['friends', 'requests'];

export const useFriends = () => {
    return useQuery({
        queryKey: FRIENDS_QUERY_KEY,
        queryFn: friendService.getFriends,
        refetchInterval: 30_000,
    });
};

export const usePendingRequests = () => {
    return useQuery({
        queryKey: FRIEND_REQUESTS_QUERY_KEY,
        queryFn: friendService.getPendingRequests,
    });
};

export const useFriendProfile = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['friends', 'profile', userId],
        queryFn: () => friendService.getFriendProfile(userId as string),
        enabled: !!userId,
    });
};

export const useSearchUsers = (query: string) => {
    return useQuery({
        queryKey: ['friends', 'search', query],
        queryFn: () => friendService.search(query),
        enabled: query.trim().length >= 2,
    });
};

export const useSendFriendRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (addresseeId: string) => friendService.sendRequest(addresseeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['friends', 'search'] });
        },
    });
};

export const useAcceptFriendRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId: string) => friendService.acceptRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
        },
    });
};

export const useRejectFriendRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId: string) => friendService.rejectRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
        },
    });
};

export const useRemoveFriend = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => friendService.removeFriend(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        },
    });
};
