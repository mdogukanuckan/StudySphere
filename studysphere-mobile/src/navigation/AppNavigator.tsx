import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { MainNavigator } from './MainNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import { useTheme } from '../context/ThemeContext';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { usePushNotifications } from '../hooks/usePushNotifications';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const { token, isRestoring: isAuthRestoring } = useAuthContext();
    const { colors, mode, isRestoring: isThemeRestoring } = useTheme();

    useHeartbeat(!!token);
    usePushNotifications(!!token);

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

    if (isAuthRestoring || isThemeRestoring) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
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
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
