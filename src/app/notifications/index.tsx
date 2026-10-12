import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { NotificationItem } from '@/components/common/NotificationItem';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationRepository } from '@/data/notificationRepository';
import { CUSTOMER_NOTIFICATION_FILTERS, STAFF_NOTIFICATION_FILTERS, getNotificationGroup } from '@/data/notificationAdapter';
import type { NotificationActor, NotificationGroup } from '@/data/notificationAdapter';
import type { AppNotification } from '@/types/notification';

type ReadAction = { kind: 'ALL' } | { kind: 'OPEN'; id: string };

export default function NotificationsScreen() {
  const router = useRouter();
  const { currentRole } = useAuth();
  const { actor, notifications, unreadCount } = useNotifications();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(currentRole === 'STAFF' ? '/staff' : '/(tabs)');
  };
  if (!actor) return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable style={styles.backBtn} onPress={goBack} accessibilityLabel="Quay lại"><IconSymbol name="back" size={20} /></Pressable><Text style={styles.headerTitle}>Thông báo</Text></View>
      <EmptyState icon="bell" title="Vui lòng đăng nhập" description="Đăng nhập để xem thông báo dành riêng cho tài khoản của bạn."
        actionText="Đăng nhập" onAction={() => router.push('/auth/login')} />
    </SafeAreaView>
  );
  return <NotificationsContent key={actor.userId + ':' + actor.role} actor={actor} notifications={notifications} unreadCount={unreadCount} goBack={goBack} />;
}

function NotificationsContent({ actor, notifications, unreadCount, goBack }: {
  actor: NotificationActor; notifications: readonly AppNotification[]; unreadCount: number; goBack: () => void;
}) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<NotificationGroup>('ALL');
  const [loadState, setLoadState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState('');
  const [retryAction, setRetryAction] = useState<ReadAction | null>(null);
  const [notice, setNotice] = useState('');
  const requests = useRef(new Set<AbortController>());
  const inFlight = useRef(false);
  const filters = actor.role === 'STAFF' ? STAFF_NOTIFICATION_FILTERS : CUSTOMER_NOTIFICATION_FILTERS;
  const filtered = notifications.filter((item) => activeFilter === 'ALL' || getNotificationGroup(item) === activeFilter);

  useEffect(() => {
    const activeRequests = requests.current;
    const controller = new AbortController();
    activeRequests.add(controller);
    void NotificationRepository.load(actor, controller.signal).then(() => {
      if (!controller.signal.aborted) setLoadState('READY');
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setLoadError(error instanceof Error ? error.message : 'Chưa tải được thông báo.');
        setLoadState('ERROR');
      }
    }).finally(() => activeRequests.delete(controller));
    return () => { activeRequests.forEach((request) => request.abort()); activeRequests.clear(); };
  }, [actor, attempt]);

  const read = async (action: ReadAction) => {
    if (inFlight.current || loadState !== 'READY') return;
    inFlight.current = true;
    setReading(true); setReadError(''); setNotice('');
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      await NotificationRepository.markRead(actor, action.kind === 'OPEN' ? action.id : undefined, controller.signal);
      if (controller.signal.aborted) return;
      setRetryAction(null);
      if (action.kind === 'ALL') setNotice('Đã đọc tất cả thông báo của bạn.');
      else {
        const target = NotificationRepository.resolveTarget(actor, action.id);
        if (target.kind === 'AVAILABLE') router.push(target.destination);
        else router.push({ pathname: '/notifications/[id]', params: { id: action.id } });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setReadError(error instanceof Error ? error.message : 'Chưa cập nhật trạng thái đã đọc.');
        setRetryAction(action);
      }
    } finally {
      requests.current.delete(controller); inFlight.current = false;
      if (!controller.signal.aborted) setReading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} accessibilityLabel="Quay lại"><IconSymbol name="back" size={20} color={BrandColors.gray800} /></Pressable>
        <Text style={styles.headerTitle}>{actor.role === 'STAFF' ? 'Thông báo công việc' : 'Thông báo của bạn'}</Text>
        <Pressable disabled={reading || loadState !== 'READY' || unreadCount === 0}
          hitSlop={10}
          accessibilityRole="button" accessibilityState={{ disabled: reading || loadState !== 'READY' || unreadCount === 0 }}
          accessibilityLabel={reading ? 'Đang cập nhật trạng thái đã đọc' : unreadCount === 0 ? 'Bạn đã đọc tất cả thông báo' : 'Đọc tất cả thông báo của tài khoản này'}
          onPress={() => void read({ kind: 'ALL' })}>
          <Text style={[styles.markAllText, (reading || loadState !== 'READY' || unreadCount === 0) && styles.disabledText]}>{reading ? 'Đang đọc…' : 'Đọc tất cả'}</Text>
        </Pressable>
      </View>
      <View style={styles.filterBar}>
        <Text style={styles.countText}>{loadState === 'READY' ? 'Chưa đọc: ' + unreadCount : 'Đang tải danh sách thông báo'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
          {filters.map((filter) => {
            const selected = activeFilter === filter.id;
            const count = notifications.filter((item) => !item.isRead && (filter.id === 'ALL' || getNotificationGroup(item) === filter.id)).length;
            return <Pressable key={filter.id} style={[styles.filterPill, selected && styles.filterPillActive]}
              accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setActiveFilter(filter.id)}>
              <Text style={[styles.filterPillText, selected && styles.filterPillTextActive]}>{filter.label}{loadState === 'READY' ? ' (' + count + ')' : ''}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </View>
      {!!notice && <Text style={styles.feedback} accessibilityLiveRegion="polite">{notice}</Text>}
      {!!readError && <View style={styles.feedbackBox}><Text style={styles.feedback} accessibilityLiveRegion="polite">{readError}</Text>
        <Pressable disabled={reading} style={styles.retryButton} onPress={() => retryAction && void read(retryAction)}><Text style={styles.retryText}>Thử lại</Text></Pressable></View>}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loadState === 'LOADING' ? <View style={styles.loadingBox}><ActivityIndicator color={BrandColors.primary} /><Text style={styles.feedback}>Đang tải thông báo…</Text></View> :
          loadState === 'ERROR' ? <EmptyState icon="warning" title="Chưa tải được thông báo" description={loadError} actionText="Thử lại"
            onAction={() => { setLoadState('LOADING'); setAttempt((value) => value + 1); }} /> :
          filtered.length === 0 ? <EmptyState icon="bell" title="Chưa có thông báo" description={activeFilter === 'ALL' ? 'Tài khoản của bạn chưa có thông báo.' : 'Chưa có thông báo trong nhóm đang chọn.'} /> :
          filtered.map((item) => <NotificationItem key={item.id} notification={item} disabled={reading} onPress={() => void read({ kind: 'OPEN', id: item.id })} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  countText: { paddingHorizontal: Spacing.three, marginBottom: Spacing.two, color: BrandColors.gray600, fontSize: 13 },
  pillScroll: { paddingHorizontal: Spacing.three, gap: Spacing.one },
  disabledText: { color: BrandColors.gray400 },
  feedback: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, color: BrandColors.gray600, fontSize: 13 },
  feedbackBox: { paddingBottom: Spacing.two, alignItems: 'center' },
  retryButton: { padding: Spacing.two, backgroundColor: BrandColors.primary, borderRadius: BorderRadius.md },
  retryText: { color: BrandColors.white, fontWeight: '700' },
  loadingBox: { alignItems: 'center', paddingVertical: Spacing.four },

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray600,
  },
  filterPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.three,
  },
});
