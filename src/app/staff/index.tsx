import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { StaffService, StaffJobItem } from '@/data/staffService';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';

export default function StaffDashboard() {
  const router = useRouter();
  const { currentStaff } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [openShifts, setOpenShifts] = useState<StaffJobItem[]>([]);
  const [activeJob, setActiveJob] = useState<StaffJobItem | undefined>(undefined);
  const [wallet, setWallet] = useState(StaffService.getWallet());

  const staffName = currentStaff?.fullName || 'Nguyễn Thị Hoa';
  const staffAvatar =
    currentStaff?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80';

  useEffect(() => {
    const updateData = () => {
      setOpenShifts(StaffService.getOpenShifts());
      setActiveJob(StaffService.getActiveJob() || StaffService.getUpcomingJobs()[0]);
      setWallet(StaffService.getWallet());
    };
    updateData();
    const unsubscribe = StaffService.subscribe(updateData);
    return unsubscribe;
  }, []);

  const handleToggleOnline = (val: boolean) => {
    setIsOnline(val);
    Alert.alert(
      val ? 'Đã bật Trực tuyến' : 'Đã tạm nghỉ',
      val
        ? 'Hồ sơ của bạn đã sẵn sàng nhận các ca làm việc mới phù hợp.'
        : 'Hệ thống sẽ không gửi ca mới cho bạn trong thời gian tạm nghỉ.'
    );
  };

  const handleClaimShift = (shift: StaffJobItem) => {
    Alert.alert(
      'Xác nhận nhận ca',
      `Bạn có chắc muốn nhận ca "${shift.serviceName}" tại ${shift.district} (${shift.timeSlot})?\nThu nhập dự kiến: ${shift.netIncome.toLocaleString('vi-VN')}đ`,
      [
        { text: 'Suy nghĩ lại', style: 'cancel' },
        {
          text: 'Nhận ca ngay',
          onPress: () => {
            const success = StaffService.claimOpenShift(shift.id);
            if (success) {
              Alert.alert(
                'Nhận ca thành công! 🎉',
                'Ca làm việc đã được chuyển vào mục "Ca làm việc của tôi". Bạn có thể mở xem chi tiết ngay bây giờ.',
                [
                  { text: 'Để sau' },
                  {
                    text: 'Xem chi tiết',
                    onPress: () => router.push({ pathname: '/staff/job-detail', params: { id: shift.id } }),
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#ECFDF5', '#F8FAFC', '#FFFFFF']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={styles.profileRow}
                onPress={() => router.push('/staff/profile')}
              >
                <Image source={{ uri: staffAvatar }} style={styles.avatar} />
                <View>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.greeting}>{staffName}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Đã xác thực</Text>
                    </View>
                  </View>
                  <Text style={styles.subGreeting}>Đối tác dịch vụ gia đình 5★</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.notificationBtn}
                onPress={() => router.push('/notifications')}
              >
                <IconSymbol name="bell" size={20} color={BrandColors.gray700} />
                <View style={styles.notificationDot} />
              </Pressable>
            </View>

            {/* Online/Offline Status Banner */}
            <LinearGradient
              colors={isOnline ? ['#0F766E', '#059669'] : ['#475569', '#334155']}
              style={styles.statusBanner}
            >
              <View style={styles.statusTopRow}>
                <View style={styles.statusIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isOnline ? '#34D399' : '#94A3B8' },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {isOnline ? 'Đang sẵn sàng nhận ca' : 'Đang tạm dừng nhận việc'}
                  </Text>
                </View>

                <View style={styles.switchWrapper}>
                  <Switch
                    value={isOnline}
                    onValueChange={handleToggleOnline}
                    trackColor={{ false: '#64748B', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <Text style={styles.statusTitle}>
                {isOnline
                  ? 'Bán kính quét việc: 10 km quanh Bình Thạnh'
                  : 'Bật trực tuyến để tiếp tục nhận ca làm việc mới'}
              </Text>

              <View style={styles.statusFooter}>
                <Text style={styles.statusMeta}>
                  {isOnline ? 'Khu vực: Bình Thạnh · Q.1 · Q.2 · Q.3' : 'Chế độ nghỉ ngơi'}
                </Text>
                <Pressable
                  onPress={() => router.push('/staff/availability')}
                  style={styles.editAreaBtn}
                >
                  <Text style={styles.editAreaText}>Đăng ký lịch làm</Text>
                  <Text style={styles.editAreaArrow}>›</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Active / Current Urgent Shift Banner */}
            {activeJob && (
              <View style={styles.activeJobContainer}>
                <View style={styles.activeJobHeader}>
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentDot}>●</Text>
                    <Text style={styles.urgentText}>
                      {activeJob.status === 'IN_PROGRESS'
                        ? 'CA ĐANG LÀM VIỆC'
                        : activeJob.status === 'EN_ROUTE'
                        ? 'ĐANG DI CHUYỂN'
                        : 'CA TIẾP THEO'}
                    </Text>
                  </View>
                  <Text style={styles.activeJobCode}>{activeJob.bookingCode}</Text>
                </View>

                <View style={styles.activeJobBody}>
                  <View style={styles.activeJobInfo}>
                    <Text style={styles.activeJobService}>{activeJob.serviceName}</Text>
                    <Text style={styles.activeJobTime}>⏱️ {activeJob.timeSlot}</Text>
                    <Text style={styles.activeJobAddress} numberOfLines={1}>
                      📍 {activeJob.address}
                    </Text>
                    <Text style={styles.activeJobCustomer}>
                      👤 Khách: <Text style={styles.boldText}>{activeJob.customerName}</Text> •{' '}
                      {activeJob.distanceKm} km
                    </Text>
                  </View>

                  <View style={styles.activeJobActionColumn}>
                    <Text style={styles.activeJobIncome}>
                      +{activeJob.netIncome.toLocaleString('vi-VN')}đ
                    </Text>
                    <Pressable
                      style={styles.activeJobBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/staff/job-detail',
                          params: { id: activeJob.id },
                        })
                      }
                    >
                      <Text style={styles.activeJobBtnText}>Vào chi tiết</Text>
                      <Text style={styles.activeJobBtnArrow}>→</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <Pressable
                style={styles.metricCard}
                onPress={() => router.push('/staff/wallet')}
              >
                <Text style={styles.metricLabel}>Số dư khả dụng</Text>
                <Text style={styles.metricValue}>
                  {(wallet.balance.available / 1000000).toFixed(2)}tr
                </Text>
                <Text style={styles.metricSub}>Rút tiền ngay ›</Text>
              </Pressable>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Đánh giá đối tác</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.metricValue}>4.92</Text>
                  <Text style={styles.metricStar}>★</Text>
                </View>
                <Text style={styles.metricSub}>248 lượt khen ngợi</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Tỷ lệ hoàn thành</Text>
                <Text style={styles.metricValue}>99%</Text>
                <Text style={styles.metricSub}>312 ca thành công</Text>
              </View>
            </View>

            {/* Available Shifts Section */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Việc mới quanh bạn</Text>
                <Text style={styles.sectionSubtitle}>
                  Dựa trên kỹ năng và khu vực bạn đã đăng ký
                </Text>
              </View>
              <Pressable onPress={() => router.push({ pathname: '/staff/jobs', params: { tab: 'open' } })}>
                <Text style={styles.seeAllText}>Xem tất cả ({openShifts.length}) ›</Text>
              </Pressable>
            </View>

            {openShifts.length === 0 ? (
              <View style={styles.emptyOpenShifts}>
                <Text style={styles.emptyOpenShiftsTitle}>Hiện không có ca trống quanh khu vực</Text>
                <Text style={styles.emptyOpenShiftsSub}>
                  Bạn có thể mở rộng bán kính hoạt động trong cài đặt để nhận thêm nhiều việc.
                </Text>
              </View>
            ) : (
              openShifts.slice(0, 3).map((shift) => (
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <View style={styles.shiftBadge}>
                      <IconSymbol name={shift.serviceIcon || 'clean'} size={16} color="#047857" />
                      <Text style={styles.shiftServiceTitle}>{shift.serviceName}</Text>
                    </View>
                    <Text style={styles.shiftIncome}>
                      +{shift.netIncome.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>

                  <Text style={styles.shiftPackage}>{shift.packageTitle}</Text>

                  <View style={styles.shiftMetaList}>
                    <View style={styles.shiftMetaItem}>
                      <Text style={styles.shiftMetaText}>⏱️ {shift.date} • {shift.timeSlot}</Text>
                    </View>
                    <View style={styles.shiftMetaItem}>
                      <Text style={styles.shiftMetaText} numberOfLines={1}>
                        📍 {shift.address} ({shift.district})
                      </Text>
                    </View>
                    <View style={styles.shiftMetaItem}>
                      <Text style={styles.shiftDistanceText}>🚶 Cách bạn {shift.distanceKm} km</Text>
                    </View>
                  </View>

                  {shift.notes ? (
                    <View style={styles.shiftNoteBox}>
                      <Text style={styles.shiftNoteText} numberOfLines={2}>
                        💬 Ghi chú: {shift.notes}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.shiftActionRow}>
                    <Pressable
                      style={styles.detailBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/staff/job-detail',
                          params: { id: shift.id },
                        })
                      }
                    >
                      <Text style={styles.detailBtnText}>Chi tiết</Text>
                    </Pressable>

                    <Pressable
                      style={styles.claimBtn}
                      onPress={() => handleClaimShift(shift)}
                    >
                      <Text style={styles.claimBtnText}>Nhận ca ngay</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            {/* Safety & Support Banner */}
            <View style={styles.supportCard}>
              <IconSymbol name="shield" size={20} color="#0369A1" />
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Tổng đài hỗ trợ đối tác 24/7</Text>
                <Text style={styles.supportText}>
                  Nếu gặp sự cố tại điểm làm việc, vui lòng gọi ngay hotline 1900 6868 để được trợ giúp khẩn cấp.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Persistent Staff Bottom Nav */}
      <StaffBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 24, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#10B981' },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greeting: { color: BrandColors.gray900, fontSize: 18, fontWeight: '900' },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: { color: '#047857', fontSize: 10, fontWeight: '800' },
  subGreeting: { color: BrandColors.gray500, fontSize: 12, marginTop: 2 },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationDot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  statusBanner: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#047857',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#ECFDF5', fontSize: 14, fontWeight: '800' },
  switchWrapper: { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] },
  statusTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 12 },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statusMeta: { color: '#D1FAE5', fontSize: 12 },
  editAreaBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editAreaText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  editAreaArrow: { color: '#FFFFFF', fontSize: 18, lineHeight: 18 },

  activeJobContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#059669',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentDot: { color: '#EF4444', fontSize: 10 },
  urgentText: { color: '#DC2626', fontSize: 11, fontWeight: '900' },
  activeJobCode: { color: BrandColors.gray500, fontSize: 12, fontWeight: '700' },
  activeJobBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  activeJobInfo: { flex: 1, gap: 4 },
  activeJobService: { color: BrandColors.gray900, fontSize: 15, fontWeight: '900' },
  activeJobTime: { color: '#047857', fontSize: 12, fontWeight: '800' },
  activeJobAddress: { color: BrandColors.gray600, fontSize: 12 },
  activeJobCustomer: { color: BrandColors.gray500, fontSize: 11 },
  boldText: { fontWeight: '700', color: BrandColors.gray800 },
  activeJobActionColumn: { alignItems: 'flex-end', gap: 6 },
  activeJobIncome: { color: '#047857', fontSize: 15, fontWeight: '900' },
  activeJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  activeJobBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  activeJobBtnArrow: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  metricsRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: { color: BrandColors.gray500, fontSize: 10, fontWeight: '700' },
  metricValue: { color: BrandColors.gray900, fontSize: 18, fontWeight: '900', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metricStar: { color: '#F59E0B', fontSize: 16, fontWeight: '900' },
  metricSub: { color: '#059669', fontSize: 10, fontWeight: '700', marginTop: 4 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { color: BrandColors.gray900, fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { color: BrandColors.gray500, fontSize: 11, marginTop: 2 },
  seeAllText: { color: '#047857', fontSize: 12, fontWeight: '800' },

  emptyOpenShifts: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyOpenShiftsTitle: { color: BrandColors.gray700, fontSize: 13, fontWeight: '800' },
  emptyOpenShiftsSub: {
    color: BrandColors.gray500,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftServiceTitle: { color: '#047857', fontSize: 13, fontWeight: '900' },
  shiftIncome: { color: '#047857', fontSize: 16, fontWeight: '900' },
  shiftPackage: { color: BrandColors.gray900, fontSize: 14, fontWeight: '800' },
  shiftMetaList: { gap: 3 },
  shiftMetaItem: { flexDirection: 'row', alignItems: 'center' },
  shiftMetaText: { color: BrandColors.gray600, fontSize: 12 },
  shiftDistanceText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  shiftNoteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  shiftNoteText: { color: BrandColors.gray600, fontSize: 11, fontStyle: 'italic' },
  shiftActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  detailBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: { color: BrandColors.gray700, fontSize: 12, fontWeight: '800' },
  claimBtn: {
    flex: 2,
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  supportCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  supportContent: { flex: 1 },
  supportTitle: { color: '#0369A1', fontSize: 12, fontWeight: '900' },
  supportText: { color: '#0C4A6E', fontSize: 11, lineHeight: 16, marginTop: 2 },
});
