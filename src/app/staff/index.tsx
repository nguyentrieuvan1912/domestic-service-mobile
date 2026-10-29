import { useFocusEffect } from 'expo-router';
import { remoteImageSource } from '@/utils/image-source';
import React, { useCallback, useState, useEffect } from 'react';
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
import { StaffService, StaffJobItem, StaffOperationalProfile } from '@/data/staffService';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';
import { StaffScheduleNotice } from '@/components/staff/StaffScheduleReminder';
import { NotificationBadge } from '@/components/common/NotificationBadge';
import { useNotifications } from '@/hooks/use-notifications';
import { useStaffMatching } from '@/hooks/use-staff-matching';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';
import { StaffMatchingRepository } from '@/data/connectedStaffRepository';
import { StaffMatchingList, MatchingSortPicker, DEFAULT_MATCH_FILTER } from '@/components/staff/StaffMatchingList';
import { EmptyState } from '@/components/common/EmptyState';
import { MatchingModePicker, matchingModeCounts } from '@/components/staff/MatchingModePicker';

export default function StaffDashboard() {
  const { currentUser, currentStaff, refreshProfile } = useAuth();
  useFocusEffect(useCallback(() => { void refreshProfile().catch(() => undefined); }, [refreshProfile]));
  const router = useRouter();
  if (!getCapabilityActor(currentUser, currentStaff)) return <SafeAreaView style={{ flex: 1 }}><EmptyState icon="shield" title="Vui lòng đăng nhập nhân viên" actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} /></SafeAreaView>;
  return <StaffDashboardContent key={currentUser!.id} />;
}
function StaffDashboardContent() {
  const router = useRouter();
  const { currentStaff } = useAuth();
  const { unreadCount } = useNotifications();
  const matching = useStaffMatching();
  const [matchFilter, setMatchFilter] = useState(DEFAULT_MATCH_FILTER);
  const [matchMode, setMatchMode] = useState<'A' | 'B'>('B');
  const counts = matchingModeCounts(matching.data);
  const matchCount = counts[matchMode];
  const staffId = currentStaff?.id || '';

  const [profile, setProfile] = useState<StaffOperationalProfile>(() => StaffService.getOperationalProfile(staffId));
  const [activeJob, setActiveJob] = useState<StaffJobItem | undefined>(undefined);
  const [wallet, setWallet] = useState(() => StaffService.getWallet(staffId));

  const isOnline = profile.isOnline;
  const staffName = currentStaff?.fullName || profile.fullName;
  const staffAvatar =
    currentStaff?.avatar ||
    profile.avatar ||
    '/api/v1/identity/staff-avatar.png';

  useEffect(() => {
    const updateData = () => {
      setProfile(StaffService.getOperationalProfile(staffId));
      setActiveJob(StaffService.getActiveJob(staffId) || StaffService.getUpcomingJobs(staffId)[0]);
      setWallet(StaffService.getWallet(staffId));
    };
    updateData();
    const unsubscribe = StaffService.subscribe(updateData);
    return unsubscribe;
  }, [staffId]);

  const handleToggleOnline = async (value: boolean) => {
    if (matching.actor) try { await StaffMatchingRepository.setOnline(matching.actor, value); } catch (error) { Alert.alert('Chưa lưu được', error instanceof Error ? error.message : 'Vui lòng thử lại.'); }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#ECFDF5', '#F8FAFC', '#FFFFFF']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <StaffScheduleNotice />
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={styles.profileRow}
                onPress={() => router.push('/staff/profile')}
              >
                <Image source={remoteImageSource(staffAvatar)} style={styles.avatar} />
                <View>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.greeting}>{staffName}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>{currentStaff?.isVerified ? '✓ Hồ sơ đã xác minh' : 'Hồ sơ chưa xác minh'}</Text>
                    </View>
                  </View>
                  <Text style={styles.subGreeting}>Đối tác dịch vụ gia đình</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.notificationBtn}
                accessibilityRole="button"
                accessibilityLabel={`Thông báo, ${unreadCount} chưa đọc`}
                onPress={() => router.push('/notifications')}
              >
                <IconSymbol name="bell" size={20} color={BrandColors.gray700} />
                <NotificationBadge count={unreadCount} />
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
                  ? `${profile.operatingDistricts.length} khu vực • ${StaffService.getScheduleSnapshot(staffId).saved.days.reduce((sum, day) => sum + day.intervals.length, 0)} khoảng rảnh đã lưu`
                  : 'Bật trực tuyến để tiếp tục nhận ca làm việc mới'}
              </Text>

              <View style={styles.statusFooter}>
                <Text style={styles.statusMeta}>
                  {isOnline ? `Khu vực: ${profile.operatingDistricts.join(' · ')}` : 'Chế độ nghỉ ngơi'}
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
                      👤 Khách: <Text style={styles.boldText}>{activeJob.customerName}</Text>
                    </Text>
                  </View>

                  <View style={styles.activeJobActionColumn}>
                    <Text style={styles.activeJobIncome}>
                      {activeJob.incomePendingPolicy ? 'Chờ quyết toán' : '+'+activeJob.netIncome.toLocaleString('vi-VN')+'đ'}
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
                  <Text style={styles.metricValue}>{profile.rating.toFixed(2)}</Text>
                  <Text style={styles.metricStar}>★</Text>
                </View>
                <Text style={styles.metricSub}>{profile.reviewCount} lượt khen ngợi</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Tỷ lệ hoàn thành</Text>
                <Text style={styles.metricValue}>{profile.completionRate}%</Text>
                <Text style={styles.metricSub}>Đạt chuẩn dịch vụ</Text>
              </View>
            </View>

            {/* Available Shifts Section */}
            <MatchingModePicker value={matchMode} onChange={setMatchMode} invitations={counts.A} open={counts.B} />
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Tìm việc phù hợp</Text>
                <Text style={styles.sectionSubtitle}>
                  Theo năng lực, khu vực và lịch đã lưu
                </Text>
              </View>
              <Pressable onPress={() => router.push({ pathname: '/staff/jobs', params: { tab: 'open', source: matchMode } })}>
                <Text style={styles.seeAllText}>Xem tất cả ({matchCount}) ›</Text>
              </Pressable>
            </View>

            <MatchingSortPicker value={matchFilter.sort} onChange={sort => setMatchFilter(value => ({ ...value, sort }))} />
            <StaffMatchingList matching={matching} filter={{ ...matchFilter, mode: matchMode }} limit={3} />

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
  statusMeta: { color: '#D1FAE5', fontSize: 12, flex: 1, paddingRight: 8 },
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
