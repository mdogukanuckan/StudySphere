// App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// SafeAreaView artık 'react-native' yerine 'react-native-safe-area-context'ten
// import ediliyor (bkz. CustomHeader/LoginScreen/RegisterScreen) — bu paketin
// doğru çalışması (gerçek inset değerlerini hesaplayabilmesi) için ağacın en
// tepesinde bir SafeAreaProvider olması gerekiyor, önceden hiç yoktu.
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Kendi yazdığın diğer importlar (AuthProvider, AppNavigator vs.)
 import { AuthProvider } from './src/context/AuthContext';
// ThemeProvider: eskiden theme/colors.ts + her ekranda tekrar eden
// 'const isDarkMode = false' satırlarıyla sahte/ölü bir dark mode iskelesi
// vardı. Artık gerçek, kullanıcının değiştirebildiği ve SecureStore'da
// kalıcı olan tek bir tema kaynağı var (bkz. context/ThemeContext.tsx).
// AuthProvider'ın DIŞINDA: giriş ekranları da (Login/Register) temayı
// kullanabilmeli.
import { ThemeProvider } from './src/context/ThemeContext';
// Oda bildirimlerini (kronometre durdu/devam etti, oda kapatıldı) açıp
// kapatma tercihi — ThemeProvider gibi cihaza bağlı, giriş gerektirmiyor,
// bu yüzden aynı seviyede.
import { NotificationSettingsProvider } from './src/context/NotificationSettingsContext';
// WebSocket bağlantısı (çalışma odalarındaki canlı güncellemeler için) —
// AuthProvider'ın İÇİNDE olmalı çünkü bağlantıyı kurmak için mevcut kullanıcının
// token'ına ihtiyaç duyuyor (bkz. context/SocketContext.tsx).
import { SocketProvider } from './src/context/SocketContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// 1. Query Client örneğini oluşturuyoruz (Önbellek deposu)
const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationSettingsProvider>
          <QueryClientProvider client={queryClient}>
            {/* Diğer Context'lerin ve Navigator'ın bunun içinde yer almalı */}
             <AuthProvider>
               <SocketProvider>
                 <AppNavigator />
               </SocketProvider>
             </AuthProvider>
          </QueryClientProvider>
        </NotificationSettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}