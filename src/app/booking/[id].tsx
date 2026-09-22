import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BookingStatusBadge } from '@/components/common/BookingStatusBadge';
import { RatingStars } from '@/components/common/RatingStars';
import { PriceSummary } from '@/components/common/PriceSummary';
import { formatVND } from '@/components/common/Badge';
import {
  getBookingById,
  getServiceById,
  getStaffById,
  getCustomerById,
  getAddressesByCustomerId,
  getInvoiceByBookingId,
  mockBookings,
} from '@/data';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState(
    getBookingById(id || 'bk-001') || mockBookings[0]
  );
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const service = getServiceById(booking.serviceId);
  const staff = booking.staffId ? getStaffById(booking.staffId) : getStaffById('staff-001');
  const invoice = getInvoiceByBookingId(booking.id);

  const isCompleted = booking.status === 'COMPLETED';
  const canCancel = ['PENDING', 'MATCHING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'STAFF_ASSIGNED'].includes(
    booking.status
  );

  const handleCallStaff = () => {
    Alert.alert(
      'Cuộc gọi thoại bảo mật',
      'Đang kết nối qua tổng đài mã hóa của CleanMaster. Số điện thoại cá nhân của bạn được bảo mật tuyệt đối.',
      [{ text: 'Đồng ý gọi' }, { text: 'Hủy', style: 'cancel' }]
    );
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Xác nhận hủy đơn',
      'Đơn hàng hủy trước 12h sẽ được hoàn 100% tiền về phương thức ban đầu. Bạn có muốn tiếp tục?',
      [
        { text: 'Giữ lại đơn', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: () => {
            setBooking({
              ...booking,
              status: 'CANCELLED',
              cancellationReason: 'Khách hàng hủy đơn chủ động',
            });
            Alert.alert('Đã hủy', 'Đơn hàng đã được chuyển sang trạng thái Đã hủy.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="back" size={20} color={BrandColors.gray800} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <Pressable
          style={styles.invoiceBtn}
          onPress={() => setShowInvoiceModal(true)}>
          <Text style={styles.invoiceBtnText}>🧾 Hóa đơn</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Status Card & Code */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View>
              <Text style={styles.bookingCodeText}>{booking.bookingCode}</Text>
              <Text style={styles.bookingDateText}>
                Đặt ngày: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <BookingStatusBadge status={booking.status} />
          </View>

          {booking.status === 'MATCHING' && (
            <View style={styles.matchingNotice}>
              <Text style={styles.matchingNoticeText}>
                ⚡ Đang tìm nhân viên phù hợp gần bạn trong bán kính 5km...
              </Text>
            </View>
          )}

          {booking.status === 'CANCELLED' && booking.cancellationReason && (
            <View style={styles.cancelNotice}>
              <Text style={styles.cancelNoticeText}>
                Lý do hủy: {booking.cancellationReason}
              </Text>
            </View>
          )}
        </View>

        {/* Service Info Block */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeading}>Dịch vụ đã đặt</Text>
          <View style={styles.serviceRow}>
            <Image source={{ uri: service?.image }} style={styles.serviceThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{service?.name}</Text>
              <Text style={styles.packageLabel}>
                {booking.mode === 'MODE_A' ? 'Tự chọn thợ' : 'Hệ thống điều phối'} • {booking.requiredStaffCount} thợ
              </Text>
              <Text style={styles.scheduleText}>
                🕒 {booking.bookingDate} • {booking.startTime} - {booking.endTime}
              </Text>
            </View>
          </View>

          {/* Add-ons list */}
          {booking.addOns && booking.addOns.length > 0 && (
            <View style={styles.addonSection}>
              <Text style={styles.subHeading}>Dịch vụ bổ sung kèm theo:</Text>
              {booking.addOns.map((add, idx) => (
                <View key={idx} style={styles.addonLine}>
                  <Text style={styles.addonName}>+ {add.addOnName} (x{add.quantity})</Text>
                  <Text style={styles.addonPrice}>{formatVND(add.price * add.quantity)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Staff Card (If assigned) */}
        {staff && booking.status !== 'MATCHING' && booking.status !== 'NO_STAFF_FOUND' && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeading}>Nhân viên phụ trách</Text>
            <View style={styles.staffRow}>
              <Image source={{ uri: staff.avatar }} style={styles.staffAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{staff.fullName}</Text>
                <RatingStars rating={staff.rating} size={12} reviewCount={staff.reviewCount} />
                <Text style={styles.staffExp}>{staff.experienceYears} năm kinh nghiệm • Đã xác minh</Text>
              </View>
            </View>

            <View style={styles.staffContactRow}>
              <Pressable style={styles.contactBtn} onPress={handleCallStaff}>
                <Text style={styles.contactBtnText}>📞 Gọi bảo mật</Text>
              </Pressable>
              <Pressable
                style={[styles.contactBtn, styles.contactBtnPrimary]}
                onPress={() => router.push('/chat/conv-001')}>
                <Text style={styles.contactBtnTextPrimary}>💬 Nhắn tin</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Timeline Progress */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeading}>Tiến trình đơn hàng</Text>
          <View style={styles.timelineList}>
            <View style={styles.timelineStep}>
              <View style={styles.timelineDotActive} />
              <View style={styles.timelineCol}>
                <Text style={styles.timelineStepTitle}>Đã tạo đơn thành công</Text>
                <Text style={styles.timelineStepTime}>Hệ thống ghi nhận đơn và lưu mã đặt lịch</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  ['CONFIRMED', 'STAFF_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) &&
                    styles.timelineDotActive,
                ]}
              />
              <View style={styles.timelineCol}>
                <Text style={styles.timelineStepTitle}>Điều phối & Phân công thợ</Text>
                <Text style={styles.timelineStepTime}>Thợ nhận việc và chuẩn bị di chuyển</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  ['IN_PROGRESS', 'COMPLETED'].includes(booking.status) && styles.timelineDotActive,
                ]}
              />
              <View style={styles.timelineCol}>
                <Text style={styles.timelineStepTitle}>Thực hiện dịch vụ</Text>
                <Text style={styles.timelineStepTime}>Nhân viên làm việc theo quy trình 5 sao</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  booking.status === 'COMPLETED' && styles.timelineDotActive,
                ]}
              />
              <View style={styles.timelineCol}>
                <Text style={styles.timelineStepTitle}>Nghiệm thu & Hoàn tất</Text>
                <Text style={styles.timelineStepTime}>Bàn giao sạch sẽ, thanh toán và đánh giá</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price & Payment Summary */}
        <PriceSummary
          packagePrice={booking.packagePrice}
          addOns={booking.addOns?.map((a) => ({
            name: a.addOnName,
            price: a.price,
            quantity: a.quantity,
          }))}
          staffCount={booking.requiredStaffCount}
          discountAmount={booking.discountAmount}
          voucherCode={booking.promotionCode}
          totalAmount={booking.totalAmount}
        />

        {/* Action Buttons */}
        <View style={styles.bottomActions}>
          {isCompleted && (
            <Pressable
              style={styles.rateBtn}
              onPress={() =>
                router.push({
                  pathname: '/booking/review',
                  params: { bookingId: booking.id },
                })
              }>
              <Text style={styles.rateBtnText}>⭐ Đánh giá nhân viên</Text>
            </Pressable>
          )}

          {canCancel && (
            <Pressable style={styles.cancelBtn} onPress={handleCancelBooking}>
              <Text style={styles.cancelBtnText}>Hủy đơn dịch vụ</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.rebookBtn}
            onPress={() =>
              router.push({
                pathname: '/booking/new',
                params: {
                  rebook: 'true',
                  serviceId: booking.serviceId,
                  packageId: booking.packageId,
                  staffId: booking.staffId,
                  addressId: booking.addressId,
                  mode: booking.staffId ? 'MODE_A' : 'MODE_B',
                },
              })
            }>
            <Text style={styles.rebookBtnText}>
              {booking.staffId && staff ? `🔄 Đặt lại với ${staff.fullName}` : '🔄 Đặt lại dịch vụ này'}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* VAT / PAYMENT INVOICE MODAL */}
      <Modal
        visible={showInvoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvoiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceModalBox}>
            <View style={styles.invoiceModalHeader}>
              <Text style={styles.invoiceModalTitle}>Hóa đơn dịch vụ điện tử</Text>
              <Pressable onPress={() => setShowInvoiceModal(false)}>
                <IconSymbol name="close" size={20} color={BrandColors.gray800} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.invCode}>Số hóa đơn: {invoice?.invoiceNumber || `HD-2026-${booking.id}`}</Text>
              <Text style={styles.invDate}>Ngày lập: {new Date().toLocaleDateString('vi-VN')}</Text>

              <View style={styles.invDivider} />

              <Text style={styles.invCompany}>ĐƠN VỊ CUNG CẤP: HOMECARE PLATFORM</Text>
              <Text style={styles.invSub}>Mã số thuế: 0312345678</Text>
              <Text style={styles.invSub}>Dịch vụ: {service?.name}</Text>

              <View style={styles.invDivider} />

              <View style={styles.invRow}>
                <Text style={styles.invItem}>Giá dịch vụ</Text>
                <Text style={styles.invVal}>{formatVND(booking.packagePrice)}</Text>
              </View>
              {booking.addOnsTotal > 0 && (
                <View style={styles.invRow}>
                  <Text style={styles.invItem}>Dịch vụ thêm</Text>
                  <Text style={styles.invVal}>{formatVND(booking.addOnsTotal)}</Text>
                </View>
              )}
              {booking.discountAmount > 0 && (
                <View style={styles.invRow}>
                  <Text style={[styles.invItem, { color: '#059669' }]}>Chiết khấu khuyến mãi</Text>
                  <Text style={[styles.invVal, { color: '#059669' }]}>-{formatVND(booking.discountAmount)}</Text>
                </View>
              )}

              <View style={styles.invDivider} />

              <View style={styles.invRow}>
                <Text style={styles.invTotalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.invTotalVal}>{formatVND(booking.totalAmount)}</Text>
              </View>
              <Text style={styles.invPaidStatus}>Trạng thái: Đã thanh toán hợp lệ</Text>
            </ScrollView>

            <Pressable
              style={styles.closeInvoiceBtn}
              onPress={() => setShowInvoiceModal(false)}>
              <Text style={styles.closeInvoiceText}>Đóng hóa đơn</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 10,
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
  invoiceBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  invoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: 12,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  bookingDateText: {
    fontSize: 11,
    color: BrandColors.gray400,
    marginTop: 2,
  },
  matchingNotice: {
    backgroundColor: '#EDE9FE',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: 10,
  },
  matchingNoticeText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  cancelNotice: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: 10,
  },
  cancelNoticeText: {
    fontSize: 12,
    color: BrandColors.danger,
    fontWeight: '600',
  },
  sectionBox: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceThumb: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  packageLabel: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginVertical: 2,
  },
  scheduleText: {
    fontSize: 12,
    color: BrandColors.primary,
    fontWeight: '600',
  },
  addonSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
    marginBottom: 4,
  },
  addonLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  addonName: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  addonPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  staffExp: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  staffContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contactBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  contactBtnPrimary: {
    backgroundColor: '#ECFDF5',
  },
  contactBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  timelineList: {
    gap: 12,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: BrandColors.primary,
  },
  timelineCol: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  timelineStepTime: {
    fontSize: 11,
    color: BrandColors.gray400,
    marginTop: 2,
  },
  bottomActions: {
    gap: 10,
    marginTop: 6,
  },
  rateBtn: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  rateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.danger,
  },
  rebookBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  rebookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  invoiceModalBox: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
  },
  invoiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  invoiceModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  invCode: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  invDate: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  invDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  invCompany: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  invSub: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  invRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  invItem: {
    fontSize: 12,
    color: BrandColors.gray700,
  },
  invVal: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray900,
  },
  invTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  invTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  invPaidStatus: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 6,
  },
  closeInvoiceBtn: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  closeInvoiceText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
