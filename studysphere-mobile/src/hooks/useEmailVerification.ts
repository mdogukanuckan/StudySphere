import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendVerificationCode, verifyEmail } from '../api/authService';
import { CURRENT_USER_QUERY_KEY } from './useUser';

export const useSendVerificationCode = () => {
    return useMutation({
        mutationFn: sendVerificationCode,
    });
};

export const useVerifyEmail = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (code: string) => verifyEmail(code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
        },
    });
};
