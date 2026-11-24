import { BookingCommunicationBridge } from '@/components/common/BookingCommunicationBridge';
import { BookingCancellationNotice } from '@/components/booking/BookingCancellationNotice';
import { SystemAlertHost } from '@/components/common/SystemAlertHost';
import React, { useCallback, useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { StaffScheduleReminder } from '@/components/staff/StaffScheduleReminder';
import { AppBackground } from '@/components/common/AppBackground';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthStack />
          <SystemAlertHost />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AuthStack() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, colors } = useAppTheme();
  const gradient = colors.backgroundGradient;
  // The navigator calls this callback while building descriptors for a changing set of routes.
  const renderScreenLayout = useCallback(({ children }: React.PropsWithChildren) => (
    <AppBackground gradient={gradient}>{children}</AppBackground>
  ), [gradient]);
  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      text: colors.text,
      primary: colors.primary,
    },
  };
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenLayout={renderScreenLayout}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="staff/(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="staff/job-detail" options={{ headerShown: false }} />
          <Stack.Screen name="staff/availability" options={{ headerShown: false }} />
          <Stack.Screen name="staff/areas" options={{ headerShown: false }} />
          <Stack.Screen name="staff/account-details" options={{ headerShown: false }} />
          <Stack.Screen name="staff/personal-info" options={{ headerShown: false }} />
          <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="catalog/index" options={{ headerShown: false }} />
          <Stack.Screen name="booking/rebook" options={{ headerShown: false }} />
          <Stack.Screen name="booking/waiting" options={{ headerShown: false }} />
          <Stack.Screen name="booking/payment" options={{ headerShown: false }} />
            <Stack.Screen name="booking/new" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/matching" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="booking/review" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="call/[id]" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="chat/trash" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="ai/index" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="blog/[slug]" />
          <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="account/addresses" options={{ headerShown: false }} />
          <Stack.Screen name="account/wallet" options={{ headerShown: false }} />
          <Stack.Screen name="account/personal-info" options={{ headerShown: false }} />
          <Stack.Screen name="account/change-password" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
        {isAuthenticated && <StaffScheduleReminder />}
        {isAuthenticated && <BookingCommunicationBridge />}
        {isAuthenticated && <BookingCancellationNotice />}
    </NavigationThemeProvider>

  );
}
