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
            // isEmailVerified degeri /users/me uzerinden gelir; dogrulama basarili
            // olunca ProfileScreen ve oda olusturma/katilma akislarinin guncel
            // durumu gormesi icin cache'i tazeliyoruz.
            queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
        },
    });
};
