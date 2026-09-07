import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Badge, formatVND } from '@/components/common/Badge';
import { IconSymbol } from '@/components/common/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { mockBookings } from '@/data/bookings';
import { getServiceById, getStaffById } from '@/data';
import { BookingStatus } from '@/types/booking';

type TabFilter = 'ALL' | 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';

export default function BookingsScreen() {
  const router = useRouter();
  const { currentRole } = useAuth();
  const isStaff = currentRole === 'STAFF';

  const [activeFilter, setActiveFilter] = useState<TabFilter>('ALL');

  const filteredBookings = mockBookings.filter((b) => {
    switch (activeFilter) {
      case 'IN_PROGRESS':
        return b.status === 'IN_PROGRESS';
      case 'UPCOMING':
        return ['PENDING', 'MATCHING', 'ASSIGNED', 'ACCEPTED'].includes(b.status);
      case 'COMPLETED':
        return b.status === 'COMPLETED';
      case 'ABSENT':
        return b.status === 'ABSENT';
      case 'CANCELLED':
        return ['CANCELLED', 'REJECTED'].includes(b.status);
      case 'ALL':
      default:
        return true;
    }
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge label="Đang làm" variant="primary" size="sm" />;
      case 'ACCEPTED':
      case 'ASSIGNED':
        return <Badge label="Đã xác nhận" variant="info" size="sm" />;
      case 'MATCHING':
      case 'PENDING':
        return <Badge label="Chờ nhận" variant="warning" size="sm" />;
      case 'COMPLETED':
        return <Badge label="Hoàn thành" variant="success" size="sm" />;
      case 'ABSENT':
        return <Badge label="Khách vắng mặt" variant="warning" size="sm" />;
      case 'CANCELLED':
        return <Badge label="Đã hủy" variant="danger" size="sm" />;
      case 'REJECTED':
        return <Badge label="Từ chối" variant="danger" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isStaff ? 'Lịch sử ca làm của bạn' : 'Đơn dịch vụ của tôi'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isStaff
              ? 'Theo dõi ca làm, thu nhập 80% & thời gian làm việc ghi nhận'
              : 'Theo dõi tiến trình & lịch sử đơn hàng'}
          </Text>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}>
            <Pressable
              style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setActiveFilter('ALL')}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'ALL' && styles.filterChipTextActive,
                ]}>
                Tất cả ({mockBookings.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'IN_PROGRESS' && styles.filterChipActive]}
              onPress={() => setActiveFilter('IN_PROGRESS')}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'IN_PROGRESS' && styles.filterChipTextActive,
                ]}>
                Đang làm
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'UPCOMING' && styles.filterChipActive]}
              onPress={() => setActiveFilter('UPCOMING')}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'UPCOMING' && styles.filterChipTextActive,
                ]}>
                Sắp tới
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'COMPLETED' && styles.filterChipActive]}
              onPress={() => setActiveFilter('COMPLETED')}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'COMPLETED' && styles.filterChipTextActive,
                ]}>
                Hoàn thành
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'ABSENT' && styles.filterChipActive]}
              onPress={() => setActiveFilter('ABSENT')}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'ABSENT' && styles.filterChipTextActive,
                ]}>
                Khách vắng mặt
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, activeFilter === 'CANCELLED' && styles.filterChipActive]}
              onPress={() => setActiveFilter('CANCELLED')}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'CANCELLED' && styles.filterChipTextActive,
                ]}>
                Đã hủy
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Bookings List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bookingsList}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
              <Text style={styles.emptyTitle}>Chưa có đơn dịch vụ nào</Text>
              <Text style={styles.emptySubtitle}>
                Các đơn hàng thuộc trạng thái này sẽ xuất hiện ở đây
              </Text>
            </View>
          ) : (
            filteredBookings.map((b) => {
              const service = getServiceById(b.serviceId);
              const staff = getStaffById('staff-001');

              return (
                <Pressable
                  key={b.id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/booking/${b.id}`)}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.codeRow}>
                      <Text style={styles.bookingCode}>{b.bookingCode}</Text>
                      <Badge
                        label={b.mode === 'MODE_A' ? 'Mode A' : 'Mode B'}
                        variant="neutral"
                        size="sm"
                      />
                    </View>
                    {getStatusBadge(b.status)}
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Image
                      source={{
                        uri:
                          service?.image ||
                          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150',
                      }}
                      style={styles.serviceThumbnail}
                    />

                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceName}>
                        {service?.name || 'Vệ sinh gia đình'}
                      </Text>
                      <Text style={styles.scheduleText}>
                        🕒 {b.startTime} - {b.endTime} • {b.bookingDate}
                      </Text>
                      <Text style={styles.staffNameText}>
                        👤 {isStaff ? 'Khách hàng: Nguyễn Thị Hoa' : `Nhân viên: ${staff?.fullName || 'Đang điều phối'}`}
                      </Text>
                    </View>
                  </View>

                  {/* Special Status Notes */}
                  {b.status === 'ABSENT' && (
                    <View style={styles.absentNoticeBox}>
                      <IconSymbol name="warning" size={14} color="#B45309" />
                      <Text style={styles.absentNoticeText}>
                        Khách vắng mặt: Nhân viên đã chờ 30 phút. Ghi nhận 1 giờ làm việc tính thu nhập. Không phạt khách.
                      </Text>
                    </View>
                  )}

                  {b.status === 'CANCELLED' && b.cancellationReason && (
                    <View style={styles.cancelNoticeBox}>
                      <IconSymbol name="close" size={14} color={BrandColors.danger} />
                      <Text style={styles.cancelNoticeText}>
                        Hủy bởi {b.cancelledBy || 'Hệ thống'}: {b.cancellationReason}
                      </Text>
                    </View>
                  )}

                  {/* Card Footer: Financials (Section 19: 80% Staff, 20% Platform) */}
                  <View style={styles.cardFooter}>
                    {isStaff ? (
                      <View style={styles.staffIncomeRow}>
                        <View>
                          <Text style={styles.priceLabel}>Thu nhập ca (80%)</Text>
                          <Text style={styles.staffIncomeText}>
                            {formatVND(b.totalAmount * 0.8)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.priceLabel}>Tổng khách trả</Text>
                          <Text style={styles.totalPriceText}>{formatVND(b.totalAmount)}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.customerPriceRow}>
                        <Text style={styles.priceLabel}>Tổng thanh toán:</Text>
                        <Text style={styles.totalPriceText}>{formatVND(b.totalAmount)}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
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
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  filterBar: {
    paddingVertical: Spacing.one,
  },
  filterScroll: {
    paddingHorizontal: Spacing.three,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  filterChipTextActive: {
    color: BrandColors.white,
  },
  bookingsList: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  bookingCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingCode: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray800,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  serviceThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.two,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  scheduleText: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginBottom: 2,
  },
  staffNameText: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  absentNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  absentNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 14,
  },
  cancelNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelNoticeText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.danger,
    lineHeight: 14,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray100,
    paddingTop: Spacing.two,
  },
  customerPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffIncomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  staffIncomeText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  totalPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray800,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
});
