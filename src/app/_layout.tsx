import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StaffScheduleReminder } from '@/components/staff/StaffScheduleReminder';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><AuthStack /></AuthProvider></SafeAreaProvider>;
}

function AuthStack() {
  const { isAuthenticated, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <>
        <StatusBar style="dark" />
        <Stack initialRouteName="auth/login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="staff/index" options={{ headerShown: false }} />
          <Stack.Screen name="staff/jobs" options={{ headerShown: false }} />
          <Stack.Screen name="staff/job-detail" options={{ headerShown: false }} />
          <Stack.Screen name="staff/wallet" options={{ headerShown: false }} />
          <Stack.Screen name="staff/availability" options={{ headerShown: false }} />
          <Stack.Screen name="staff/community" options={{ headerShown: false }} />
          <Stack.Screen name="staff/profile" options={{ headerShown: false }} />
          <Stack.Screen name="staff/account-details" options={{ headerShown: false }} />
          <Stack.Screen name="staff/personal-info" options={{ headerShown: false }} />
          <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="catalog/index" options={{ headerShown: false }} />
          <Stack.Screen name="booking/waiting" options={{ headerShown: false }} />
            <Stack.Screen name="booking/new" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/matching" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="booking/review" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="ai/index" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="account/addresses" options={{ headerShown: false }} />
          <Stack.Screen name="account/personal-info" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
        {isAuthenticated && <StaffScheduleReminder />}
    </>

  );
}
