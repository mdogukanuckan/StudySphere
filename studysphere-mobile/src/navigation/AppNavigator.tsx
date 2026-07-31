import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { Dimensions, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { MainNavigator } from './MainNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import { useTheme } from '../context/ThemeContext';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { usePushNotifications } from '../hooks/usePushNotifications';

const MIN_SPLASH_DURATION_MS = 1800;

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const { token, isRestoring: isAuthRestoring } = useAuthContext();
    const { colors, mode, isRestoring: isThemeRestoring } = useTheme();
    const [minSplashElapsed, setMinSplashElapsed] = useState(false);
    const [screenSize, setScreenSize] = useState(() => Dimensions.get('screen'));

    useHeartbeat(!!token);
    usePushNotifications(!!token);

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});
        const timeout = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_DURATION_MS);
        const subscription = Dimensions.addEventListener('change', ({ screen }) => setScreenSize(screen));
        return () => {
            clearTimeout(timeout);
            subscription.remove();
        };
    }, []);

    const navigationTheme = useMemo(() => {
        const base = mode === 'dark' ? DarkTheme : DefaultTheme;
        return {
            ...base,
            dark: mode === 'dark',
            colors: {
                ...base.colors,
                primary: colors.primary,
                background: colors.background,
                card: colors.surface,
                text: colors.text,
                border: colors.border,
            },
        };
    }, [mode, colors]);

    if (isAuthRestoring || isThemeRestoring || !minSplashElapsed) {
        return (
            <Image
                source={require('../../assets/studysphere_photo.png')}
                resizeMode="cover"
                style={[styles.splashImage, { width: screenSize.width, height: screenSize.height }]}
            />
        );
    }

    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {token ? (
                    <>
                        <Stack.Screen name="MainApp" component={MainNavigator} />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ headerShown: true, title: 'Profilim' }}
                        />
                        <Stack.Screen
                            name="Friends"
                            component={FriendsScreen}
                        />
                        <Stack.Screen
                            name="FriendProfile"
                            component={FriendProfileScreen}
                        />
                        <Stack.Screen
                            name="VerifyEmail"
                            component={VerifyEmailScreen}
                            options={{ headerShown: true, title: 'E-posta Doğrulama' }}
                        />
                    </>
                ) : (
                    <Stack.Screen name="AuthFlow" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    splashImage: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
