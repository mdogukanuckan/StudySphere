import { useMutation } from '@tanstack/react-query';
import { forgotPassword, resetPassword, ResetPasswordRequest } from '../api/authService';

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (email: string) => forgotPassword(email),
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data: ResetPasswordRequest) => resetPassword(data),
    });
};
