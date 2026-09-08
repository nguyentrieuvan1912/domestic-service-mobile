import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { VerticalTimeline, TimelineStep } from '@/components/common/StepIndicator';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { mockBookings } from '@/data/bookings';
import { getServiceById, getStaffById } from '@/data';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentRole } = useAuth();
  const isStaff = currentRole === 'STAFF';

  // Find booking or default
  const [booking, setBooking] = useState(
    mockBookings.find((b) => b.id === id) || mockBookings[0]
  );

  const service = getServiceById(booking.serviceId);
  // Assigned staff lookup
  const staff = getStaffById('staff-001');

  // Privacy: Check if communication is locked (Section 17: locked after completed/cancelled/absent)
  const isCommunicationLocked = ['COMPLETED', 'CANCELLED', 'ABSENT'].includes(
    booking.status
  );

  const handleSecureCall = () => {
    if (isCommunicationLocked) {
      Alert.alert(
        'Đã kết thúc liên lạc',
        'Cuộc gọi qua nền tảng đã khóa sau khi đơn hàng hoàn tất/đóng theo quy định bảo mật thông tin cá nhân.'
      );
      return;
    }
    Alert.alert(
      'Cuộc gọi bảo mật HomeCare',
      'Đang kết nối qua tổng đài thoại của nền tảng. Số điện thoại cá nhân và email của đôi bên được bảo mật tuyệt đối.',
      [{ text: 'Đồng ý kết nối' }, { text: 'Hủy', style: 'cancel' }]
    );
  };

  const handleOpenChat = () => {
    if (isCommunicationLocked) {
      Alert.alert(
        'Đã đóng kênh chat',
        'Kênh chat trong ứng dụng đã khóa tự động sau khi kết thúc đơn để bảo vệ quyền riêng tư của hai bên.'
      );
      return;
    }
    router.push('/chat/conv-001');
  };

  // Staff action: Report absent (Section 16: waited 30 mins, earns 1h pay, no customer penalty)
  const handleReportAbsent = () => {
    Alert.alert(
      'Xác nhận khách vắng mặt',
      'Bạn đã đến nơi và chờ khách đủ 30 phút mà không thể liên hệ? Hệ thống sẽ chuyển đơn sang trạng thái "Vắng mặt" và tính 1 giờ làm việc cho bạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận vắng mặt',
          onPress: () => {
            setBooking({
              ...booking,
              status: 'ABSENT',
              notes: 'Nhân viên đã chờ 30 phút, không liên lạc được với khách hàng.',
            });
            Alert.alert('Thành công', 'Đã cập nhật trạng thái: Khách vắng mặt (Ghi nhận 1h công).');
          },
        },
      ]
    );
  };

  // Staff action: Complete booking
  const handleCompleteBooking = () => {
    Alert.alert(
      'Nghiệm thu hoàn thành',
      'Bạn đã hoàn thành công việc và dọn dẹp sạch sẽ? Khách hàng sẽ thanh toán và đánh giá dịch vụ.',
      [
        { text: 'Chưa', style: 'cancel' },
        {
          text: 'Đã hoàn thành',
          onPress: () => {
            setBooking({
              ...booking,
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
            });
            Alert.alert('Chúc mừng!', 'Đơn hàng đã hoàn thành. 80% thu nhập đã được cộng vào tài khoản.');
          },
        },
      ]
    );
  };

  // Timeline steps
  const timelineSteps: TimelineStep[] = [
    {
      key: 'step-1',
      title: 'Đã tạo đơn',
      subtitle: booking.mode === 'MODE_A' ? 'Khách đã chỉ định nhân viên' : 'Đơn treo trên hệ thống',
      timestamp: `${booking.startTime} ${booking.bookingDate}`,
      isCompleted: true,
      isActive: false,
    },
    {
      key: 'step-2',
      title: 'Xác nhận tiếp nhận',
      subtitle: staff ? `Nhân viên ${staff.fullName} đã tiếp nhận` : 'Chờ nhân viên nhận đơn',
      timestamp: `${booking.startTime} ${booking.bookingDate}`,
      isCompleted: !['PENDING', 'MATCHING'].includes(booking.status),
      isActive: ['ASSIGNED', 'ACCEPTED'].includes(booking.status),
    },
    {
      key: 'step-3',
      title: 'Thực hiện dịch vụ',
      subtitle:
        booking.status === 'ABSENT'
          ? 'Khách vắng mặt (Đã chờ 30 phút)'
          : 'Nhân viên đang tiến hành công việc',
      timestamp: `${booking.startTime} ${booking.bookingDate}`,
      isCompleted: ['COMPLETED', 'ABSENT'].includes(booking.status),
      isActive: booking.status === 'IN_PROGRESS',
    },
    {
      key: 'step-4',
      title: 'Hoàn tất & Đóng đơn',
      subtitle:
        booking.status === 'ABSENT'
          ? 'Đơn đóng: Khách vắng mặt (Tính 1h công)'
          : booking.status === 'CANCELLED'
          ? `Đã hủy bởi ${booking.cancelledBy || 'hệ thống'}`
          : 'Dịch vụ đã hoàn tất và nghiệm thu',
      timestamp: booking.completedAt
        ? new Date(booking.completedAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : booking.status === 'COMPLETED'
        ? 'Hoàn thành'
        : 'Đang xử lý',
      isCompleted: ['COMPLETED', 'ABSENT', 'CANCELLED'].includes(booking.status),
      isActive: false,
    },
  ];

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'IN_PROGRESS':
        return { label: 'Đang thực hiện', variant: 'primary' as const, bg: '#ECFDF5' };
      case 'COMPLETED':
        return { label: 'Đã hoàn thành', variant: 'success' as const, bg: '#F0FDF4' };
      case 'ACCEPTED':
      case 'ASSIGNED':
        return { label: 'Đã xác nhận', variant: 'info' as const, bg: '#EFF6FF' };
      case 'ABSENT':
        return { label: 'Khách vắng mặt', variant: 'warning' as const, bg: '#FFFBEB' };
      case 'CANCELLED':
        return { label: 'Đã hủy đơn', variant: 'danger' as const, bg: '#FEF2F2' };
      case 'PENDING':
      case 'MATCHING':
        return { label: 'Chờ nhận đơn', variant: 'neutral' as const, bg: '#F3F4F6' };
      default:
        return { label: booking.status, variant: 'neutral' as const, bg: '#F3F4F6' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Chi tiết đơn dịch vụ" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Status Hero Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusBadge.bg }]}>
          <View style={styles.statusPulseDotRow}>
            {booking.status === 'IN_PROGRESS' && <View style={styles.livePulseDot} />}
            <Badge label={statusBadge.label} variant={statusBadge.variant} size="md" />
          </View>
          <Text style={styles.statusBannerTitle}>
            {booking.status === 'IN_PROGRESS' && 'Dịch vụ đang diễn ra'}
            {booking.status === 'COMPLETED' && 'Đơn hàng hoàn tất'}
            {booking.status === 'ABSENT' && 'Đơn kết thúc: Khách vắng mặt'}
            {booking.status === 'CANCELLED' && 'Đơn hàng đã bị hủy'}
            {['PENDING', 'MATCHING'].includes(booking.status) && 'Đang điều phối nhân viên'}
            {['ASSIGNED', 'ACCEPTED'].includes(booking.status) && 'Nhân viên đã tiếp nhận'}
          </Text>
          <Text style={styles.statusBannerSubtitle}>
            {booking.status === 'ABSENT'
              ? 'Nhân viên đã đến và chờ 30 phút. Ghi nhận 1 giờ công cho nhân viên. Không phạt khách hàng.'
              : booking.status === 'CANCELLED'
              ? `Người hủy: ${booking.cancelledBy || 'Hệ thống'} • Lý do: ${booking.cancellationReason || 'Không có'}`
              : `Mã đơn: ${booking.bookingCode} • Đóng băng giá dịch vụ`}
          </Text>
        </View>

        {/* Privacy Notice Bar */}
        <View style={styles.privacyNoticeBar}>
          <IconSymbol name="shield" size={14} color={BrandColors.primary} />
          <Text style={styles.privacyNoticeText}>
            {isCommunicationLocked
              ? '🔒 Tính năng gọi thoại và nhắn tin đã khóa sau khi kết thúc đơn để bảo vệ thông tin riêng tư.'
              : '🛡️ Mọi liên lạc thực hiện qua hệ thống. Tuyệt đối không giao dịch ngoài nền tảng.'}
          </Text>
        </View>

        {/* Assigned Staff Info Card */}
        {staff && (
          <View style={styles.cardSection}>
            <Text style={styles.cardSectionTitle}>Nhân viên phụ trách</Text>
            <View style={styles.staffRow}>
              <Image source={{ uri: staff.avatar }} style={styles.staffAvatar} />
              <View style={styles.staffDetails}>
                <Text style={styles.staffFullName}>{staff.fullName}</Text>
                <Text style={styles.staffRoleText}>
                  Đối tác tự do • {staff.experienceYears} năm kinh nghiệm
                </Text>
                <RatingStars
                  rating={staff.rating}
                  reviewCount={staff.reviewCount}
                  size={12}
                />
              </View>

              {/* Call & Chat Action Buttons (Masked / In-platform) */}
              <View style={styles.staffActions}>
                <Pressable
                  style={[
                    styles.actionCircleBtn,
                    isCommunicationLocked && styles.actionCircleBtnDisabled,
                  ]}
                  onPress={handleSecureCall}>
                  <IconSymbol
                    name="phone"
                    size={16}
                    color={isCommunicationLocked ? BrandColors.gray400 : BrandColors.primary}
                  />
                </Pressable>

                <Pressable
                  style={[
                    styles.actionCircleBtn,
                    styles.chatCircleBtn,
                    isCommunicationLocked && styles.chatCircleBtnDisabled,
                  ]}
                  onPress={handleOpenChat}>
                  <IconSymbol
                    name="chat"
                    size={16}
                    color={isCommunicationLocked ? BrandColors.gray400 : BrandColors.white}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Timeline Stepper */}
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Tiến trình đơn hàng</Text>
          <VerticalTimeline steps={timelineSteps} />
        </View>

        {/* Booking Details Card */}
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Thông tin đặt dịch vụ</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mã đơn hàng</Text>
            <Text style={styles.detailValueBold}>{booking.bookingCode}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dịch vụ chính</Text>
            <Text style={styles.detailValue}>{service?.name || 'Vệ sinh gia đình'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Khung giờ</Text>
            <Text style={styles.detailValue}>
              {booking.startTime} – {booking.endTime} (Trước 20:00)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày thực hiện</Text>
            <Text style={styles.detailValue}>{booking.bookingDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hình thức</Text>
            <Text style={styles.detailValue}>
              {booking.mode === 'MODE_A'
                ? 'Mode A: Khách chỉ định nhân viên'
                : 'Mode B: Hệ thống treo đơn tự nhận'}
            </Text>
          </View>

          {booking.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ghi chú</Text>
              <Text style={styles.detailValue}>{booking.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Financial Breakdown Card (Section 19: 80% Staff, 20% Platform) */}
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Thanh toán & Phí dịch vụ</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Giá gói chính</Text>
            <Text style={styles.detailValue}>{formatVND(booking.packagePrice)}</Text>
          </View>

          {booking.addOnsTotal > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dịch vụ phụ trợ (Add-on)</Text>
              <Text style={styles.detailValue}>+{formatVND(booking.addOnsTotal)}</Text>
            </View>
          )}

          {booking.discountAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: BrandColors.primary }]}>
                Khuyến mãi ({booking.promotionCode})
              </Text>
              <Text style={[styles.detailValue, { color: BrandColors.primary }]}>
                -{formatVND(booking.discountAmount)}
              </Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalDetailRow]}>
            <Text style={styles.totalDetailLabel}>Tổng thanh toán khách trả</Text>
            <Text style={styles.totalDetailValue}>{formatVND(booking.totalAmount)}</Text>
          </View>

          {isStaff && (
            <View style={styles.staffIncomeBreakdown}>
              <Text style={styles.staffIncomeTitle}>Chi tiết thu nhập nhân viên (Quy định Section 19):</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nhân viên nhận (80%):</Text>
                <Text style={styles.staffIncomeHighlight}>
                  {formatVND(booking.totalAmount * 0.8)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí nền tảng (20%):</Text>
                <Text style={styles.detailValue}>
                  {formatVND(booking.totalAmount * 0.2)}
                </Text>
              </View>
              <Text style={styles.tipNote}>
                💡 100% tiền Tip (nếu có) thuộc về nhân viên và không tính vào 20% phí nền tảng.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Footer Bar */}
      <View style={styles.footerBar}>
        {/* Customer Actions */}
        {!isStaff && (
          <>
            <Pressable
              style={[
                styles.contactBtn,
                isCommunicationLocked && styles.contactBtnDisabled,
              ]}
              onPress={handleOpenChat}>
              <IconSymbol
                name="chat"
                size={16}
                color={isCommunicationLocked ? BrandColors.gray400 : BrandColors.gray800}
              />
              <Text
                style={[
                  styles.contactBtnText,
                  isCommunicationLocked && styles.contactBtnTextDisabled,
                ]}>
                {isCommunicationLocked ? 'Đã khóa chat' : 'Nhắn tin'}
              </Text>
            </Pressable>

            {booking.status === 'COMPLETED' ? (
              <Pressable
                style={[styles.primaryActionBtn, styles.reviewBtn]}
                onPress={() =>
                  Alert.alert('Đánh giá nhân viên', 'Đánh giá 5★ và để lại nhận xét sau ca làm việc.')
                }>
                <Text style={styles.primaryActionBtnText}>Đánh giá dịch vụ</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.primaryActionBtn}
                onPress={handleSecureCall}>
                <Text style={styles.primaryActionBtnText}>Gọi điện thoại</Text>
              </Pressable>
            )}
          </>
        )}

        {/* Staff Actions */}
        {isStaff && (
          <View style={styles.staffActionFooter}>
            {booking.status === 'IN_PROGRESS' && (
              <>
                <Pressable
                  style={styles.absentBtn}
                  onPress={handleReportAbsent}>
                  <Text style={styles.absentBtnText}>Khách vắng mặt (30p)</Text>
                </Pressable>

                <Pressable
                  style={styles.completeBtn}
                  onPress={handleCompleteBooking}>
                  <Text style={styles.completeBtnText}>Hoàn thành ca</Text>
                </Pressable>
              </>
            )}

            {booking.status === 'COMPLETED' && (
              <View style={styles.doneNoticeBox}>
                <Text style={styles.doneNoticeText}>✓ Ca làm việc đã hoàn tất thành công</Text>
              </View>
            )}

            {booking.status === 'ABSENT' && (
              <View style={styles.doneNoticeBox}>
                <Text style={styles.doneNoticeText}>Đã đóng: Khách vắng mặt • Đã tính 1h công</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statusBanner: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  statusPulseDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  statusBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginTop: 4,
  },
  statusBannerSubtitle: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.two,
  },
  privacyNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  privacyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.primaryDark,
    lineHeight: 15,
  },

  // Card Sections
  cardSection: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },

  // Staff Row
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.two,
  },
  staffDetails: {
    flex: 1,
  },
  staffFullName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  staffRoleText: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 1,
    marginBottom: 2,
  },
  staffActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.white,
  },
  actionCircleBtnDisabled: {
    borderColor: BrandColors.gray300,
    backgroundColor: BrandColors.gray100,
  },
  chatCircleBtn: {
    backgroundColor: BrandColors.primary,
  },
  chatCircleBtnDisabled: {
    backgroundColor: BrandColors.gray200,
    borderColor: BrandColors.gray200,
  },

  // Details Row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray900,
    maxWidth: '65%',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  totalDetailRow: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    paddingTop: 8,
    marginTop: 4,
  },
  totalDetailLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  totalDetailValue: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },

  // Staff income breakdown
  staffIncomeBreakdown: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    backgroundColor: '#F8FAFC',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
  },
  staffIncomeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray700,
    marginBottom: 4,
  },
  staffIncomeHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  tipNote: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Action Footer Bar
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: BrandColors.white,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    gap: Spacing.two,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.gray300,
    backgroundColor: BrandColors.white,
  },
  contactBtnDisabled: {
    borderColor: BrandColors.gray200,
    backgroundColor: BrandColors.gray100,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  contactBtnTextDisabled: {
    color: BrandColors.gray400,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
  },
  reviewBtn: {
    backgroundColor: '#D97706',
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.white,
  },

  // Staff Footer Actions
  staffActionFooter: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  absentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.warning,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
  },
  absentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  completeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.white,
  },
  doneNoticeBox: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: BrandColors.gray100,
    borderRadius: BorderRadius.md,
  },
  doneNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray600,
  },
});
