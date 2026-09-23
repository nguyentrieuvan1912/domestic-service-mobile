import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="staff/index" options={{ headerShown: false }} />
          <Stack.Screen name="staff/jobs" options={{ headerShown: false }} />
          <Stack.Screen name="staff/job-detail" options={{ headerShown: false }} />
          <Stack.Screen name="staff/wallet" options={{ headerShown: false }} />
          <Stack.Screen name="staff/availability" options={{ headerShown: false }} />
          <Stack.Screen name="staff/profile" options={{ headerShown: false }} />
          <Stack.Screen name="staff/account-details" options={{ headerShown: false }} />
          <Stack.Screen name="staff/personal-info" options={{ headerShown: false }} />
          <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/new" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/matching" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="booking/review" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="ai/index" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
          <Stack.Screen name="account/addresses" options={{ headerShown: false }} />
          <Stack.Screen name="account/personal-info" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>

  );
}
