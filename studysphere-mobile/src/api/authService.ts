import { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";
import apiClient from "./client";
import { getErrorMessage } from "../utils/errorMessage";

export const registerUser = async (data : RegisterRequest) : Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export const loginUser = async (data : LoginRequest) : Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export const logoutUser = async (refreshToken: string): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export const sendVerificationCode = async (): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>('/auth/send-verification-code');
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export const verifyEmail = async (code: string): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>('/auth/verify-email', { code });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}