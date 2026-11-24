import { remoteImageSource } from '@/utils/image-source';
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { Booking } from '@/types/booking';
import { BookingStatusBadge } from './BookingStatusBadge';
import { formatVND } from './Badge';
import { IconSymbol } from './IconSymbol';
import { bookingServiceView, ConnectedBooking } from '@/data/connectedBookings';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  onCancel?: () => void;
  onReview?: () => void;
  onRebook?: () => void;
  onPay?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onCancel,
  onReview,
  onRebook,
  onPay,
}) => {
  const { colors } = useAppTheme();
  const service = bookingServiceView(booking as ConnectedBooking);
  const staff = (booking as ConnectedBooking & { staff?: { fullName: string; avatar: string } }).staff;

  const isCompleted = booking.status === 'COMPLETED';
  const isClosed = ['CANCELLED', 'REFUNDING', 'REFUNDED', 'NO_STAFF_FOUND', 'ABSENT', 'REJECTED'].includes(booking.status);
  const hasAcceptedStaff = (booking as ConnectedBooking).assignments?.some(item => ['ACCEPTED', 'COMPLETED'].includes(item.status));
  const canCancel = ['PENDING', 'AWAITING_PAYMENT', 'MATCHING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'STAFF_ASSIGNED'].includes(
    booking.status
  );

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      {/* Top row: Code & Status badge */}
      <View style={[styles.topRow, { borderBottomColor: colors.divider }]}>
        <View style={styles.codeGroup}>
          <Text style={[styles.codeText, { color: colors.text }]}>{booking.bookingCode}</Text>
          <Text style={[styles.dateSmall, { color: colors.textMuted }]}>
            {booking.bookingDate} • {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} size="sm" />
      </View>

      {/* Middle row: Service image, title & package */}
      <View style={styles.serviceRow}>
        {service?.image ? (
          <Image source={remoteImageSource(service.image)} style={[styles.serviceImage, { backgroundColor: colors.surfaceMuted }]} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <IconSymbol name="home" size={20} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.serviceInfo}>
          <Text numberOfLines={1} style={[styles.serviceName, { color: colors.text }]}>
            {service?.name || 'Dịch vụ gia đình'}
          </Text>
          <Text style={[styles.packageDetailText, { color: colors.textMuted }]}>
            {booking.mode === 'MODE_A' ? 'Tự chọn nhân viên' : 'Hệ thống điều phối'} • {booking.requiredStaffCount} NV
          </Text>
          {staff ? (
            <View style={styles.staffAssignedRow}>
              <Image source={remoteImageSource(staff.avatar)} style={styles.staffThumb} />
              <Text style={[styles.staffAssignedName, { color: colors.textSecondary }]}>{!hasAcceptedStaff ? 'Nhân viên đã chọn: ' : ''}{staff.fullName}</Text>
            </View>
          ) : (
            <Text style={[styles.matchingNote, { color: colors.infoText }]}>
              {isClosed ? 'Đã dừng điều phối' : booking.status === 'AWAITING_PAYMENT' ? 'Tiếp tục thanh toán để hoàn tất đặt dịch vụ.' : booking.status === 'MATCHING' ? 'Đang tìm nhân viên gần bạn...' : 'Đang xử lý điều phối'}
            </Text>
          )}
        </View>
      </View>

      {booking.status === 'CANCELLED' && (booking.cancelledAt || booking.cancellationReason) && (
        <View style={styles.cancellationInfo}>
          {!!booking.cancelledAt && <Text style={[styles.cancellationText, { color: colors.textMuted }]}>Hủy lúc {new Date(booking.cancelledAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</Text>}
          {!!booking.cancellationReason && <Text style={[styles.cancellationText, { color: colors.textSecondary }]}>{booking.cancellationReason}</Text>}
        </View>
      )}

      {/* Bottom row: Total amount & Quick action buttons */}
      <View style={[styles.bottomRow, { borderTopColor: colors.divider }]}>
        <View>
          <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Tổng tiền</Text>
          <Text style={[styles.priceValue, { color: colors.accentText }]}>{formatVND(booking.totalAmount)}</Text>
        </View>

        <View style={styles.actionsGroup}>
          {isCompleted && onReview && (
            <Pressable
              style={[styles.reviewButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={(e) => {
                e.stopPropagation();
                onReview();
              }}>
              <Text style={[styles.reviewButtonText, { color: colors.text }]}>Đánh giá</Text>
            </Pressable>
          )}

          {canCancel && onCancel && (
            <Pressable
              style={[styles.cancelButton, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
              onPress={(e) => {
                e.stopPropagation();
                onCancel();
              }}>
              <Text style={[styles.cancelButtonText, { color: colors.dangerText }]}>Hủy đơn</Text>
            </Pressable>
          )}

          {booking.status === 'AWAITING_PAYMENT' && onPay ? (
            <Pressable accessibilityRole="button" style={[styles.detailButton, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]} onPress={(event) => { event.stopPropagation(); onPay(); }}>
              <Text style={[styles.detailButtonText, { color: colors.accentText }]}>Tiếp tục thanh toán</Text>
            </Pressable>
          ) : onRebook && (
            <Pressable
              style={[styles.rebookButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={(e) => {
                e.stopPropagation();
                onRebook();
              }}>
              <Text style={[styles.rebookButtonText, { color: colors.text }]}>Đặt lại</Text>
            </Pressable>
          )}

          <Pressable style={[styles.detailButton, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]} onPress={onPress}>
            <Text style={[styles.detailButtonText, { color: colors.accentText }]}>Chi tiết</Text>
            <IconSymbol name="chevronRight" size={13} color={colors.accentText} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cancellationInfo: { paddingBottom: Spacing.two, gap: 3 },
  cancellationText: { fontSize: 11, lineHeight: 16, color: BrandColors.gray600 },
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
    gap: 6,
  },
  reviewButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.danger,
  },
  rebookButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rebookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 2,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
});
