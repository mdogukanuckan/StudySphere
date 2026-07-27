import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/userService';
import { UpdateProfileRequest } from '../types/user';

export const CURRENT_USER_QUERY_KEY = ['currentUser'];

export const useCurrentUser = () => {
    return useQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: userService.getMe,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateProfileRequest) => userService.updateMe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
        },
    });
};
