import { useCallback, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StaffRepository } from '@/data/connectedStaffRepository';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
export function StaffConnectionStatus() {
  const { currentStaff } = useAuth();
  const { colors } = useAppTheme();
  const [attempt, setAttempt] = useState(0);
  useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  useFocusEffect(useCallback(() => { if (!currentStaff) return; void StaffRepository.load().catch(() => {}); const timer=setInterval(()=>void StaffRepository.load().catch(()=>{}),10000);return()=>clearInterval(timer); }, [currentStaff?.id, attempt]));
  const state = StaffRepository.getLoadState();
  if (!currentStaff) return null;
  return !state.loaded ? <View style={{ padding: 12, gap: 8, alignItems: 'center' }}>{state.error ? <><Text accessibilityRole="alert" style={{ color: colors.dangerText, textAlign: 'center' }}>{state.error}</Text><Pressable onPress={() => setAttempt(value => value + 1)}><Text style={{ color: colors.accentText, fontWeight: '700' }}>Thử lại</Text></Pressable></> : <><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textSecondary }}>Đang tải dữ liệu nhân viên…</Text></>}</View> : null;
}
