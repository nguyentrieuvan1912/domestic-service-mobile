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
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { BookingCard } from '@/components/common/BookingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { mockBookings } from '@/data/bookings';
import { BookingStatus } from '@/types/booking';

type TabFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const FILTER_TABS: { id: TabFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'ACTIVE', label: 'Đang xử lý / Sắp tới' },
  { id: 'COMPLETED', label: 'Đã hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy / Hoàn tiền' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const [activeFilter, setActiveFilter] = useState<TabFilter>('ALL');

  const customerId = currentCustomer?.id || 'cust-001';
  const customerBookings = mockBookings.filter((b) => b.customerId === customerId);

  const filteredBookings = customerBookings.filter((b) => {
    switch (activeFilter) {
      case 'ACTIVE':
        return ['PENDING', 'MATCHING', 'CONFIRMED', 'STAFF_ASSIGNED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(
          b.status
        );
      case 'COMPLETED':
        return b.status === 'COMPLETED';
      case 'CANCELLED':
        return ['CANCELLED', 'REFUNDING', 'REFUNDED', 'NO_STAFF_FOUND', 'ABSENT', 'REJECTED'].includes(
          b.status
        );
      case 'ALL':
      default:
        return true;
    }
  });

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Hủy đơn dịch vụ',
      'Bạn có chắc chắn muốn hủy đơn hàng này? Theo chính sách hoàn tiền, hủy trước 12h sẽ được hoàn 100% chi phí.',
      [
        { text: 'Giữ lại đơn', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: () => {
            const b = mockBookings.find((item) => item.id === bookingId);
            if (b) {
              b.status = 'CANCELLED';
              b.cancellationReason = 'Khách hàng hủy đơn chủ động qua ứng dụng';
            }
            Alert.alert('Thành công', 'Đơn hàng đã được hủy.');
            setActiveFilter('CANCELLED');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đơn dịch vụ của tôi</Text>
          <Text style={styles.headerSubtitle}>
            Theo dõi tiến trình thực hiện và lịch sử phục vụ gia đình
          </Text>
        </View>

        {/* Tab Filters Pill Bar */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}>
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  onPress={() => setActiveFilter(tab.id)}>
                  <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {filteredBookings.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Chưa có đơn dịch vụ nào"
              description="Bạn chưa có lịch hẹn dịch vụ nào trong mục này. Hãy khám phá và đặt dịch vụ ngay hôm nay!"
              actionText="Khám phá dịch vụ ngay"
              onAction={() => router.push('/(tabs)/services')}
            />
          ) : (
            filteredBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onPress={() => router.push(`/booking/${b.id}`)}
                onCancel={() => handleCancel(b.id)}
                onReview={() =>
                  router.push({
                    pathname: '/booking/review',
                    params: { bookingId: b.id },
                  })
                }
                onRebook={() =>
                  router.push({
                    pathname: '/booking/new',
                    params: {
                      rebook: 'true',
                      serviceId: b.serviceId,
                      packageId: b.packageId,
                      staffId: b.staffId,
                      addressId: b.addressId,
                      mode: b.staffId ? 'MODE_A' : 'MODE_B',
                    },
                  })
                }
              />
            ))
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  filterBar: {
    marginVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: Spacing.three,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray600,
  },
  tabPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: 6,
  },
});
