import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/use-notifications';
import { StaffRepository } from '@/data/staffRepository';
import { NotificationRepository } from '@/data/notificationRepository';
import { formatNotificationTime, getNotificationPresentation, getNotificationTarget } from '@/data/notificationAdapter';
import type { NotificationActor } from '@/data/notificationAdapter';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { currentRole } = useAuth();
  const { actor } = useNotifications();
  const [attempt, setAttempt] = useState(0);
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/notifications');
  };
  if (!actor || typeof id !== 'string') return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <EmptyState icon="bell" title={actor ? 'Không tìm thấy thông báo' : 'Vui lòng đăng nhập'}
        description="Không thể mở thông báo này." actionText="Quay lại"
        onAction={() => router.replace(currentRole === 'STAFF' ? '/staff' : '/(tabs)')} />
    </SafeAreaView>
  );
  return <NotificationDetail key={actor.userId + ':' + actor.role + ':' + id + ':' + attempt}
    actor={actor} id={id} goBack={goBack} onRetry={() => setAttempt((value) => value + 1)} />;
}

function NotificationDetail({ actor, id, goBack, onRetry }: {
  actor: NotificationActor; id: string; goBack: () => void; onRetry: () => void;
}) {
  'use no memo';
  // Resolve mutable booking permissions again on every store update, including
  // StaffRepository updates which do not change notification identity.
  const router = useRouter();
  const [loadState, setLoadState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [error, setError] = useState('');
  // Booking target availability may change while this detail remains open.
  const [, refresh] = React.useReducer((value: number) => value + 1, 0);
  useEffect(() => StaffRepository.subscribe(refresh), []);
  useSyncExternalStore(NotificationRepository.subscribe, NotificationRepository.getRevision, NotificationRepository.getRevision);
  let item;
  let accessError = '';
  try { item = NotificationRepository.get(actor, id); }
  catch (failure) { accessError = failure instanceof Error ? failure.message : 'Không thể mở thông báo.'; }

  // A detail left below the login screen must not mark the next account's
  // notification as read merely because AuthContext changed.
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void NotificationRepository.load(actor, controller.signal)
      .then(() => NotificationRepository.markRead(actor, id, controller.signal))
      .then(() => { if (!controller.signal.aborted) setLoadState('READY'); })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) { setError(failure instanceof Error ? failure.message : 'Chưa tải được thông báo.'); setLoadState('ERROR'); }
      });
    return () => controller.abort();
  }, [actor, id]));

  const target = item ? NotificationRepository.resolveTarget(actor, id) : null;
  const targetType = item ? getNotificationTarget(item)?.type : undefined;
  const presentation = item ? getNotificationPresentation(item) : null;
  const ready = loadState === 'READY' && !!item && !!target;
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityLabel="Quay lại"><IconSymbol name="back" size={22} /></Pressable>
        <Text style={styles.headerTitle}>{targetType === 'INVITATION' ? 'Lời mời làm việc' : 'Chi tiết thông báo'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {accessError ? <EmptyState icon="shield" title="Không thể mở thông báo" description={accessError} actionText="Quay lại" onAction={goBack} /> :
          loadState === 'LOADING' ? <View style={styles.loading}><ActivityIndicator color={BrandColors.primary} /><Text style={styles.body}>Đang tải thông báo…</Text></View> :
          loadState === 'ERROR' ? <EmptyState icon="warning" title="Chưa tải được thông báo" description={error} actionText="Thử lại"
            onAction={onRetry} /> : item && target && presentation ? (
            <View style={styles.card}>
              <View style={styles.typeRow}><IconSymbol name={presentation.icon} size={24} /><Text style={styles.type}>{presentation.label} • Đã đọc</Text></View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>{formatNotificationTime(item.createdAt)}</Text>
              <Text style={styles.body}>{item.content}</Text>
              {target.kind === 'DETAIL_ONLY' && target.statusLabel && <Text style={styles.status}>{target.statusLabel}</Text>}
              {target.kind === 'DETAIL_ONLY' && target.summary && <Text style={styles.body}>{target.summary}</Text>}
              {target.kind !== 'AVAILABLE' && <View style={styles.unavailable}><Text style={styles.status}>{target.kind === 'DETAIL_ONLY' ? 'Chưa khả dụng' : 'Nội dung liên kết không còn khả dụng'}</Text><Text style={styles.body}>{target.reason}</Text></View>}
            </View>
          ) : null}
      </ScrollView>
      {ready && target && <View style={styles.footer}>
        <Pressable style={[styles.action, target.kind !== 'AVAILABLE' && styles.disabledAction]} disabled={target.kind !== 'AVAILABLE'}
          accessibilityRole="button" accessibilityState={{ disabled: target.kind !== 'AVAILABLE' }}
          accessibilityLabel={target.kind === 'AVAILABLE' ? target.actionLabel : target.reason}
          onPress={() => {
            const latest = NotificationRepository.resolveTarget(actor, id);
            if (latest.kind === 'AVAILABLE') router.push(latest.destination);
            else refresh();
          }}><Text style={styles.actionText}>{target.kind === 'AVAILABLE' ? target.actionLabel : 'Nội dung liên kết chưa khả dụng'}</Text></Pressable>
      </View>}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, backgroundColor: BrandColors.white },
  backButton: { padding: Spacing.one }, headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: BrandColors.gray900 },
  content: { padding: Spacing.three }, card: { padding: Spacing.three, backgroundColor: BrandColors.white, borderRadius: BorderRadius.lg, gap: Spacing.two },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, type: { fontSize: 13, color: BrandColors.gray600 },
  title: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: BrandColors.gray900 }, time: { fontSize: 12, color: BrandColors.gray500 },
  body: { fontSize: 14, lineHeight: 22, color: BrandColors.gray700 }, status: { fontSize: 14, fontWeight: '700', color: BrandColors.gray800 },
  unavailable: { padding: Spacing.two, backgroundColor: BrandColors.gray100, borderRadius: BorderRadius.md, gap: Spacing.one },
  loading: { alignItems: 'center', padding: Spacing.four, gap: Spacing.two },
  footer: { padding: Spacing.three, backgroundColor: BrandColors.white }, action: { padding: Spacing.two, backgroundColor: BrandColors.primary, borderRadius: BorderRadius.md, alignItems: 'center' },
  disabledAction: { backgroundColor: BrandColors.gray400 }, actionText: { color: BrandColors.white, fontWeight: '700', fontSize: 14 },
});
