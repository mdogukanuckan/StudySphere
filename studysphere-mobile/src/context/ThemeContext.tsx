// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
    ThemeMode,
    ThemeColors,
    PALETTES,
    SPACING,
    createShadows,
    createGlobalStyles,
    Shadows,
    GlobalStyles,
} from '../theme/theme';

export type ThemePreference = ThemeMode | 'system';

interface ThemeContextType {
    mode: ThemeMode; 
    preference: ThemePreference; 
    colors: ThemeColors;
    shadows: Shadows;
    globalStyles: GlobalStyles;
    spacing: typeof SPACING;
    isRestoring: boolean;
    setPreference: (preference: ThemePreference) => void;
}

const THEME_PREFERENCE_KEY = 'theme_preference';

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Cihazın sistem genelindeki açık/koyu mod tercihi ('light' | 'dark' | null | undefined).
    const systemScheme = useColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>('system');

    const [isRestoring, setIsRestoring] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
                if (stored === 'light' || stored === 'dark' || stored === 'system') {
                    setPreferenceState(stored);
                }
            } finally {
                setIsRestoring(false);
            }
        })();
    }, []);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);

        SecureStore.setItemAsync(THEME_PREFERENCE_KEY, next).catch(() => {});
    }, []);

    const mode: ThemeMode = preference === 'system'
        ? (systemScheme === 'dark' ? 'dark' : 'light')
        : preference;

    const colors = PALETTES[mode];
    const shadows = useMemo(() => createShadows(colors), [colors]);
    const globalStyles = useMemo(() => createGlobalStyles(colors), [colors]);

    const value = useMemo<ThemeContextType>(() => ({
        mode,
        preference,
        colors,
        shadows,
        globalStyles,
        spacing: SPACING,
        isRestoring,
        setPreference,
    }), [mode, preference, colors, shadows, globalStyles, isRestoring, setPreference]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
