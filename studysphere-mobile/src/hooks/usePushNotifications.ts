
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { deviceService } from '../api/deviceService';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const usePushNotifications = (enabled: boolean) => {
    const hasRegisteredRef = useRef(false);

    useEffect(() => {
        if (!enabled || hasRegisteredRef.current) {
            return;
        }

        (async () => {
            try {
                if (!Device.isDevice) {
                    return;
                }

                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'default',
                        importance: Notifications.AndroidImportance.DEFAULT,
                    });
                }

                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    return;
                }

                const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
                const tokenResponse = await Notifications.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined,
                );

                const deviceId = await getOrCreateDeviceId();
                await deviceService.registerPushToken(deviceId, tokenResponse.data);
                hasRegisteredRef.current = true;
            } catch {
            }
        })();
    }, [enabled]);
};
