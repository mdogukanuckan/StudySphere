import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Backend adresi .env dosyasindaki EXPO_PUBLIC_API_URL degiskeninden okunur.
// Gelistirme icin studysphere-mobile/.env dosyasina kendi bilgisayarinizin
// yerel ag IP adresini yazin (ornek: EXPO_PUBLIC_API_URL=http://192.168.1.23:3000).
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const apiClient = axios.create({
    baseURL : BASE_URL,
    headers : {
        'Content-Type' : 'application/json'
    },
});

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const storeTokens = async (accessToken: string, refreshToken?: string | null) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const clearTokens = async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

apiClient.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
};

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) return null;

            try {
                const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
                const newAccessToken: string | undefined = response.data?.access_token;
                const newRefreshToken: string | undefined = response.data?.refresh_token;
                if (!newAccessToken) return null;
                await storeTokens(newAccessToken, newRefreshToken);
                return newAccessToken;
            } catch {
                await clearTokens();
                return null;
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config;
        const status = error?.response?.status;

        if (status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            }

            await clearTokens();
            unauthorizedHandler?.();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
