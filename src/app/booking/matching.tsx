import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { RatingStars } from '@/components/common/RatingStars';
import { StaffCard } from '@/components/common/StaffCard';
import { getAvailableStaffs, getServiceById, mockStaffs } from '@/data';

type MatchingState =
  | 'SEARCHING' // 1. Đang tìm Staff
  | 'FOUND_SINGLE' // 2. Đã tìm thấy Staff
  | 'FOUND_MULTIPLE' // 3. Có nhiều Staff phù hợp
  | 'NO_STAFF' // 4. Không tìm thấy Staff
  | 'STAFF_REJECTED' // 5. Staff từ chối Booking
  | 'FINDING_REPLACEMENT' // 6. Đang tìm Staff thay thế
  | 'ACCEPTED' // 7. Booking đã được nhận
  | 'CANCELLED'; // 8. Booking đã bị hủy

export default function MatchingStaffScreen() {
  const router = useRouter();
  const { bookingId, serviceId } = useLocalSearchParams<{
    bookingId?: string;
    serviceId?: string;
  }>();

  const service = getServiceById(serviceId || 'srv-004');
  const availableStaffs = getAvailableStaffs(service?.category);
  const matchedStaff = availableStaffs[0] || mockStaffs[1];

  const [matchingState, setMatchingState] = useState<MatchingState>('SEARCHING');
  const [searchTimer, setSearchTimer] = useState(15);

  // Automated progression simulation from SEARCHING -> FOUND_SINGLE -> ACCEPTED
  useEffect(() => {
    let timer: any;
    if (matchingState === 'SEARCHING') {
      timer = setTimeout(() => {
        setMatchingState('FOUND_SINGLE');
      }, 3500);
    } else if (matchingState === 'FINDING_REPLACEMENT') {
      timer = setTimeout(() => {
        setMatchingState('FOUND_SINGLE');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [matchingState]);

  const handleCancelBooking = () => {
    Alert.alert('Hủy yêu cầu tìm thợ', 'Bạn có chắc chắn muốn hủy tìm nhân viên không?', [
      { text: 'Tiếp tục tìm', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: () => setMatchingState('CANCELLED'),
      },
    ]);
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.closeBtn}
            onPress={() => router.replace('/(tabs)/bookings')}
            hitSlop={8}>
            <IconSymbol name="close" size={20} color={BrandColors.gray800} />
          </Pressable>
          <Text style={styles.headerTitle}>Điều phối & Khớp lệnh thợ</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* INTERACTIVE STATE SIMULATOR BAR FOR TESTING & EVALUATION */}
        <View style={styles.simulatorBar}>
          <Text style={styles.simulatorLabel}>Mô phỏng 8 trạng thái Matching:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {[
              { id: 'SEARCHING', label: '1. Đang tìm' },
              { id: 'FOUND_SINGLE', label: '2. Đã tìm thấy' },
              { id: 'FOUND_MULTIPLE', label: '3. Nhiều thợ' },
              { id: 'NO_STAFF', label: '4. Không tìm thấy' },
              { id: 'STAFF_REJECTED', label: '5. Thợ từ chối' },
              { id: 'FINDING_REPLACEMENT', label: '6. Tìm thay thế' },
              { id: 'ACCEPTED', label: '7. Đã nhận việc' },
              { id: 'CANCELLED', label: '8. Đã hủy' },
            ].map((st) => (
              <Pressable
                key={st.id}
                style={[
                  styles.simBtn,
                  matchingState === st.id && styles.simBtnActive,
                ]}
                onPress={() => setMatchingState(st.id as MatchingState)}>
                <Text
                  style={[
                    styles.simBtnText,
                    matchingState === st.id && styles.simBtnTextActive,
                  ]}>
                  {st.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          {/* ================= 1. SEARCHING: Đang tìm Staff ================= */}
          {matchingState === 'SEARCHING' && (
            <View style={styles.stateCenterBox}>
              <View style={styles.radarCircleOuter}>
                <View style={styles.radarCircleMid}>
                  <View style={styles.radarCircleInner}>
                    <Text style={{ fontSize: 32 }}>📡</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.statusHeading}>Hệ thống đang tìm thợ gần bạn</Text>
              <Text style={styles.statusDescription}>
                Đang quét trong bán kính 5km tại khu vực của bạn. Ưu tiên thợ có tay nghề{' '}
                <Text style={{ fontWeight: '700', color: BrandColors.primary }}>
                  {service?.name || 'phù hợp'}
                </Text>{' '}
                và đánh giá 4.8★ trở lên.
              </Text>

              <View style={styles.matchingCriteriaCard}>
                <Text style={styles.criteriaTitle}>Tiêu chí điều phối tự động:</Text>
                <Text style={styles.criteriaItem}>✓ Đúng chuyên môn dịch vụ</Text>
                <Text style={styles.criteriaItem}>✓ Đã xác minh danh tính & lý lịch CCCD</Text>
                <Text style={styles.criteriaItem}>✓ Khoảng cách di chuyển dưới 20 phút</Text>
              </View>

              <Pressable style={styles.cancelSearchBtn} onPress={handleCancelBooking}>
                <Text style={styles.cancelSearchText}>Hủy tìm thợ</Text>
              </Pressable>
            </View>
          )}

          {/* ================= 2. FOUND_SINGLE: Đã tìm thấy Staff ================= */}
          {matchingState === 'FOUND_SINGLE' && (
            <View style={styles.stateContentBox}>
              <View style={styles.successBadgeRow}>
                <Text style={{ fontSize: 20 }}>🎉</Text>
                <Text style={styles.foundTitle}>Đã tìm thấy nhân viên phù hợp!</Text>
              </View>
              <Text style={styles.foundSub}>
                Hệ thống đã gửi thông tin đơn cho nhân viên này. Đang chờ xác nhận nhận việc.
              </Text>

              <StaffCard staff={matchedStaff} showSelectButton={false} />

              <View style={styles.actionBtnRow}>
                <Pressable
                  style={styles.primaryActionBtn}
                  onPress={() => setMatchingState('ACCEPTED')}>
                  <Text style={styles.primaryActionText}>Xác nhận chọn nhân viên này</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryActionBtn}
                  onPress={() => setMatchingState('FINDING_REPLACEMENT')}>
                  <Text style={styles.secondaryActionText}>Tìm người khác</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= 3. FOUND_MULTIPLE: Có nhiều Staff phù hợp ================= */}
          {matchingState === 'FOUND_MULTIPLE' && (
            <View style={styles.stateContentBox}>
              <Text style={styles.foundTitle}>Tìm thấy {availableStaffs.length} thợ sẵn sàng nhận đơn!</Text>
              <Text style={styles.foundSub}>
                Bạn có thể bấm chọn nhân viên yêu thích dưới đây:
              </Text>

              {availableStaffs.slice(0, 3).map((st) => (
                <StaffCard
                  key={st.id}
                  staff={st}
                  onSelect={() => {
                    setMatchingState('ACCEPTED');
                  }}
                />
              ))}
            </View>
          )}

          {/* ================= 4. NO_STAFF: Không tìm thấy Staff ================= */}
          {matchingState === 'NO_STAFF' && (
            <View style={styles.stateCenterBox}>
              <View style={[styles.radarCircleInner, { backgroundColor: '#FFE4E6' }]}>
                <Text style={{ fontSize: 36 }}>⚠️</Text>
              </View>
              <Text style={styles.statusHeading}>Hiện chưa có thợ nhận đơn</Text>
              <Text style={styles.statusDescription}>
                Tất cả nhân viên chuyên trách tại khu vực của bạn hiện đang bận hoặc ngoài khung giờ trực.
              </Text>

              <View style={styles.actionBtnRow}>
                <Pressable
                  style={styles.primaryActionBtn}
                  onPress={() => setMatchingState('SEARCHING')}>
                  <Text style={styles.primaryActionText}>Thử tìm kiếm lại</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryActionBtn}
                  onPress={() => router.replace('/(tabs)/services')}>
                  <Text style={styles.secondaryActionText}>Đổi ngày hoặc giờ khác</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= 5. STAFF_REJECTED: Staff từ chối Booking ================= */}
          {matchingState === 'STAFF_REJECTED' && (
            <View style={styles.stateCenterBox}>
              <View style={[styles.radarCircleInner, { backgroundColor: '#FEF3C7' }]}>
                <Text style={{ fontSize: 36 }}>⏳</Text>
              </View>
              <Text style={styles.statusHeading}>Thợ trước đó bận đột xuất</Text>
              <Text style={styles.statusDescription}>
                Nhân viên vừa nhận ca phát sinh khác nên không kịp đến đúng giờ. Hệ thống đang tự động tìm thợ thay thế gần nhất cho bạn.
              </Text>

              <Pressable
                style={styles.primaryActionBtn}
                onPress={() => setMatchingState('FINDING_REPLACEMENT')}>
                <Text style={styles.primaryActionText}>Tìm thợ thay thế ngay</Text>
              </Pressable>
            </View>
          )}

          {/* ================= 6. FINDING_REPLACEMENT: Đang tìm thay thế ================= */}
          {matchingState === 'FINDING_REPLACEMENT' && (
            <View style={styles.stateCenterBox}>
              <View style={styles.radarCircleInner}>
                <Text style={{ fontSize: 32 }}>🔄</Text>
              </View>
              <Text style={styles.statusHeading}>Đang tìm nhân viên thay thế</Text>
              <Text style={styles.statusDescription}>
                Đang ưu tiên mở rộng bán kính tìm kiếm lên 8km để kết nối thợ rảnh gần nhất cho đơn hàng của bạn.
              </Text>
            </View>
          )}

          {/* ================= 7. ACCEPTED: Booking đã được nhận ================= */}
          {matchingState === 'ACCEPTED' && (
            <View style={styles.stateContentBox}>
              <View style={styles.acceptedCard}>
                <View style={styles.acceptedIconCircle}>
                  <Text style={{ fontSize: 32 }}>✅</Text>
                </View>
                <Text style={styles.acceptedTitle}>Thợ đã nhận đơn thành công!</Text>
                <Text style={styles.acceptedSub}>
                  Nhân viên đang chuẩn bị dụng cụ và sẽ có mặt đúng giờ theo lịch hẹn.
                </Text>

                <View style={styles.assignedStaffCard}>
                  <Image source={{ uri: matchedStaff.avatar }} style={styles.assignedAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assignedName}>{matchedStaff.fullName}</Text>
                    <RatingStars rating={matchedStaff.rating} size={12} reviewCount={matchedStaff.reviewCount} />
                    <Text style={styles.assignedEta}>
                      Dự kiến đến trước 10 phút • SĐT đã được kết nối
                    </Text>
                  </View>
                </View>

                <View style={styles.acceptedActions}>
                  <Pressable
                    style={styles.primaryActionBtn}
                    onPress={() => router.replace(`/booking/${bookingId || 'bk-036'}`)}>
                    <Text style={styles.primaryActionText}>Xem chi tiết đơn hàng</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryActionBtn}
                    onPress={() => router.push('/chat/conv-001')}>
                    <Text style={styles.secondaryActionText}>Nhắn tin cho nhân viên</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ================= 8. CANCELLED: Booking đã bị hủy ================= */}
          {matchingState === 'CANCELLED' && (
            <View style={styles.stateCenterBox}>
              <View style={[styles.radarCircleInner, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ fontSize: 36 }}>❌</Text>
              </View>
              <Text style={styles.statusHeading}>Yêu cầu đặt đơn đã hủy</Text>
              <Text style={styles.statusDescription}>
                Đơn tìm thợ đã được hủy theo yêu cầu. Bạn có thể đặt lại vào bất kỳ thời điểm nào thuận tiện.
              </Text>

              <Pressable
                style={styles.primaryActionBtn}
                onPress={() => router.replace('/(tabs)' as any)}>
                <Text style={styles.primaryActionText}>Quay về Trang chủ</Text>
              </Pressable>

            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  simulatorBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  simulatorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray500,
    marginBottom: 6,
  },
  simBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  simBtnActive: {
    backgroundColor: BrandColors.primary,
  },
  simBtnText: {
    fontSize: 11,
    color: BrandColors.gray700,
    fontWeight: '600',
  },
  simBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  content: {
    padding: Spacing.four,
  },
  stateCenterBox: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  radarCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  radarCircleMid: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  statusHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: Spacing.four,
  },
  matchingCriteriaCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.four,
    gap: 6,
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray800,
    marginBottom: 4,
  },
  criteriaItem: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  cancelSearchBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEE2E2',
  },
  cancelSearchText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.danger,
  },
  stateContentBox: {
    gap: 12,
  },
  successBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foundTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  foundSub: {
    fontSize: 13,
    color: BrandColors.gray600,
    marginBottom: 6,
  },
  actionBtnRow: {
    marginTop: Spacing.three,
    gap: 10,
    width: '100%',
  },
  primaryActionBtn: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 13,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  secondaryActionBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  acceptedCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  acceptedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  acceptedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
  },
  acceptedSub: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 18,
  },
  assignedStaffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginVertical: 12,
    gap: 12,
  },
  assignedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  assignedName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  assignedEta: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  acceptedActions: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
});
