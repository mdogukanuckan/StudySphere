
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';

interface NotificationSettingsContextType {
  notificationsEnabled: boolean;
  isRestoring: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const NOTIFICATIONS_ENABLED_KEY = 'room_notifications_enabled';

const NotificationSettingsContext = createContext<NotificationSettingsContextType>(
  {} as NotificationSettingsContextType,
);

export const NotificationSettingsProvider = ({ children }: { children: ReactNode }) => {
  // Varsayılan: açık — istemeyen kullanıcı kendi kapatır.
  const [notificationsEnabled, setEnabledState] = useState(true);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(NOTIFICATIONS_ENABLED_KEY);
        if (stored === 'true' || stored === 'false') {
          setEnabledState(stored === 'true');
        }
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  const setNotificationsEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    SecureStore.setItemAsync(NOTIFICATIONS_ENABLED_KEY, next ? 'true' : 'false').catch(() => {});
  }, []);

  const value = useMemo<NotificationSettingsContextType>(
    () => ({ notificationsEnabled, isRestoring, setNotificationsEnabled }),
    [notificationsEnabled, isRestoring, setNotificationsEnabled],
  );

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};

export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (!context) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
};
