import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Booking } from '@/types/booking';
import { BookingStatusBadge } from './BookingStatusBadge';
import { formatVND } from './Badge';
import { IconSymbol } from './IconSymbol';
import { getServiceById, getStaffById } from '@/data';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  onCancel?: () => void;
  onReview?: () => void;
  onRebook?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onCancel,
  onReview,
  onRebook,
}) => {
  const service = getServiceById(booking.serviceId);
  const staff = booking.staffId ? getStaffById(booking.staffId) : undefined;

  const isCompleted = booking.status === 'COMPLETED';
  const canCancel = ['PENDING', 'MATCHING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'STAFF_ASSIGNED'].includes(
    booking.status
  );

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Top row: Code & Status badge */}
      <View style={styles.topRow}>
        <View style={styles.codeGroup}>
          <Text style={styles.codeText}>{booking.bookingCode}</Text>
          <Text style={styles.dateSmall}>
            {booking.bookingDate} • {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} size="sm" />
      </View>

      {/* Middle row: Service image, title & package */}
      <View style={styles.serviceRow}>
        {service?.image ? (
          <Image source={{ uri: service.image }} style={styles.serviceImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 20 }}>🏡</Text>
          </View>
        )}
        <View style={styles.serviceInfo}>
          <Text numberOfLines={1} style={styles.serviceName}>
            {service?.name || 'Dịch vụ gia đình'}
          </Text>
          <Text style={styles.packageDetailText}>
            {booking.mode === 'MODE_A' ? 'Tự chọn nhân viên' : 'Hệ thống điều phối'} • {booking.requiredStaffCount} NV
          </Text>
          {staff ? (
            <View style={styles.staffAssignedRow}>
              <Image source={{ uri: staff.avatar }} style={styles.staffThumb} />
              <Text style={styles.staffAssignedName}>{staff.fullName}</Text>
            </View>
          ) : (
            <Text style={styles.matchingNote}>
              {booking.status === 'MATCHING' ? '⚡ Đang tìm nhân viên gần bạn...' : 'Đang xử lý điều phối'}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom row: Total amount & Quick action buttons */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.priceLabel}>Tổng tiền</Text>
          <Text style={styles.priceValue}>{formatVND(booking.totalAmount)}</Text>
        </View>

        <View style={styles.actionsGroup}>
          {isCompleted && onReview && (
            <Pressable
              style={styles.reviewButton}
              onPress={(e) => {
                e.stopPropagation();
                onReview();
              }}>
              <Text style={styles.reviewButtonText}>⭐ Đánh giá</Text>
            </Pressable>
          )}

          {canCancel && onCancel && (
            <Pressable
              style={styles.cancelButton}
              onPress={(e) => {
                e.stopPropagation();
                onCancel();
              }}>
              <Text style={styles.cancelButtonText}>Hủy đơn</Text>
            </Pressable>
          )}

          {onRebook && (
            <Pressable
              style={styles.rebookButton}
              onPress={(e) => {
                e.stopPropagation();
                onRebook();
              }}>
              <Text style={styles.rebookButtonText}>🔄 Đặt lại</Text>
            </Pressable>
          )}

          <Pressable style={styles.detailButton} onPress={onPress}>
            <Text style={styles.detailButtonText}>Chi tiết</Text>
            <IconSymbol name="chevronRight" size={14} color={BrandColors.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: Spacing.two,
  },
  codeGroup: {
    flex: 1,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  dateSmall: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  packageDetailText: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginBottom: 4,
  },
  staffAssignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  staffAssignedName: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  matchingNote: {
    fontSize: 11,
    color: '#7C3AED',
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceLabel: {
    fontSize: 10,
    color: BrandColors.gray400,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  reviewButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.danger,
  },
  rebookButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  rebookButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ECFDF5',
    gap: 2,
  },
  detailButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primary,
  },
});
