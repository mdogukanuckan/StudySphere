
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { userService } from '../api/userService';

const PING_INTERVAL_MS = 60_000;

export const useHeartbeat = (enabled: boolean) => {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const sendPing = () => {
            userService.ping().catch(() => {
            });
        };

        const startInterval = () => {
            if (intervalRef.current) return;
            sendPing();
            intervalRef.current = setInterval(sendPing, PING_INTERVAL_MS);
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        if (AppState.currentState === 'active') {
            startInterval();
        }

        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                startInterval();
            } else {
                stopInterval();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            stopInterval();
            subscription.remove();
        };
    }, [enabled]);
};
