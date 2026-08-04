import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { decodeJwtPayload } from '../utils/jwt';
import { setUnauthorizedHandler, getAccessToken, getRefreshToken, refreshAccessToken, clearTokens } from '../api/client';
import { logoutUser } from '../api/authService';

interface AuthContextType {
    token : string | null;
    userId : string | null;
    isRestoring : boolean;
    setToken :(token : string |null ) => void;
    logout : () => void;
}

const AuthContext = createContext<AuthContextType> ({} as AuthContextType);
export const AuthProvider = ({children} : {children : ReactNode}) => {
    const [token , setToken] = useState<string | null>(null);
    const [isRestoring, setIsRestoring] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        (async () => {
            try {
                const storedToken = await getAccessToken();
                if (storedToken) {

                    const payload = decodeJwtPayload<{ exp?: number }>(storedToken);
                    const isExpired = !payload?.exp || payload.exp * 1000 <= Date.now();
                    if (!isExpired) {
                        setToken(storedToken);
                        return;
                    }
                }

                const refreshToken = await getRefreshToken();
                if (refreshToken) {
                    const newAccessToken = await refreshAccessToken();
                    if (newAccessToken) {
                        setToken(newAccessToken);
                        return;
                    }
                }

                await clearTokens();
            } finally {
                setIsRestoring(false);
            }
        })();
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            queryClient.clear();
            setToken(null);
        });
        return () => setUnauthorizedHandler(null);
    }, [queryClient]);

    const userId = useMemo(() => {
        if (!token) return null;
        return decodeJwtPayload<{ sub: string }>(token)?.sub ?? null;
    }, [token]);

    const logout = async () => {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            logoutUser(refreshToken).catch(() => {});
        }
        await clearTokens();
        queryClient.clear();
        setToken(null);
    };

    return (
        <AuthContext.Provider value = {{token, userId, isRestoring, setToken, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
