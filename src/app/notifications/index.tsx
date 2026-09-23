import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { NotificationItem } from '@/components/common/NotificationItem';
import { EmptyState } from '@/components/common/EmptyState';
import { mockNotifications } from '@/data/notifications';
import { Notification } from '@/types/notification';

type FilterType = 'ALL' | 'BOOKING' | 'STAFF' | 'PROMOTION' | 'SYSTEM';

const FILTER_PILLS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'BOOKING', label: 'Đơn hàng' },
  { id: 'STAFF', label: 'Nhân viên' },
  { id: 'PROMOTION', label: 'Khuyến mãi' },
  { id: 'SYSTEM', label: 'Hệ thống' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const filtered = notifications.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.type === activeFilter;
  });

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="back" size={20} color={BrandColors.gray800} />
        </Pressable>
        <Text style={styles.headerTitle}>Thông báo của bạn</Text>
        <Pressable onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Đọc tất cả</Text>
        </Pressable>
      </View>

      {/* Filter pills */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 8 }}>
          {FILTER_PILLS.map((pill) => {
            const isSelected = activeFilter === pill.id;
            return (
              <Pressable
                key={pill.id}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setActiveFilter(pill.id)}>
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}>
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Không có thông báo nào"
            description="Bạn đã cập nhật tất cả thông báo mới nhất. Khi có trạng thái đơn hoặc ưu đãi, bạn sẽ nhận được tại đây."
          />
        ) : (
          filtered.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onPress={() => {
                markItemAsRead(item.id);
                if (item.data?.bookingId) {
                  router.push(`/booking/${item.data.bookingId}`);
                }
              }}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
