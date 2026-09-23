import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { StaffService, StaffJobItem } from '@/data/staffService';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';

type TabKey = 'upcoming' | 'open' | 'completed';

export default function StaffJobsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<TabKey>(
    params.tab === 'open' ? 'open' : params.tab === 'completed' ? 'completed' : 'upcoming'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả');

  const [jobs, setJobs] = useState<StaffJobItem[]>([]);
  const [openShifts, setOpenShifts] = useState<StaffJobItem[]>([]);

  useEffect(() => {
    const refreshData = () => {
      setJobs(StaffService.getJobs());
      setOpenShifts(StaffService.getOpenShifts());
    };
    refreshData();
    const unsubscribe = StaffService.subscribe(refreshData);
    return unsubscribe;
  }, []);

  const upcomingList = jobs.filter(
    (j) => j.status === 'ACCEPTED' || j.status === 'EN_ROUTE' || j.status === 'IN_PROGRESS'
  );
  const completedList = jobs.filter((j) => j.status === 'COMPLETED');

  const currentList =
    activeTab === 'upcoming'
      ? upcomingList
      : activeTab === 'open'
      ? openShifts
      : completedList;

  const districts = ['Tất cả', 'Bình Thạnh', 'Quận 1', 'Quận 2', 'Quận 7'];

  const filteredList = currentList.filter((item) => {
    const matchSearch =
      item.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bookingCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDistrict =
      selectedDistrict === 'Tất cả' || item.district === selectedDistrict;
    return matchSearch && matchDistrict;
  });

  const handleClaim = (shift: StaffJobItem) => {
    Alert.alert(
      'Xác nhận nhận ca',
      `Bạn có chắc muốn nhận ca ${shift.serviceName} tại ${shift.district} (${shift.timeSlot})?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nhận ca ngay',
          onPress: () => {
            StaffService.claimOpenShift(shift.id);
            setActiveTab('upcoming');
            Alert.alert('Thành công', 'Đã thêm ca làm việc vào lịch của bạn!');
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: StaffJobItem['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Đang làm việc', bg: '#DCFCE7', text: '#15803D' };
      case 'EN_ROUTE':
        return { label: 'Đang di chuyển', bg: '#DBEAFE', text: '#1D4ED8' };
      case 'ACCEPTED':
        return { label: 'Đã nhận ca', bg: '#FEF3C7', text: '#B45309' };
      case 'COMPLETED':
        return { label: 'Đã hoàn thành', bg: '#F1F5F9', text: '#475569' };
      default:
        return { label: 'Mới', bg: '#ECFDF5', text: '#047857' };
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quản lý ca làm việc</Text>
          <View style={styles.badgeCounter}>
            <Text style={styles.badgeCounterText}>{upcomingList.length} ca sắp tới</Text>
          </View>
        </View>

        {/* Tab Segment Selector */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'upcoming' && styles.tabButtonTextActive]}
            >
              Sắp tới ({upcomingList.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'open' && styles.tabButtonActive]}
            onPress={() => setActiveTab('open')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'open' && styles.tabButtonTextActive]}
            >
              Việc mới ({openShifts.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'completed' && styles.tabButtonTextActive,
              ]}
            >
              Lịch sử ({completedList.length})
            </Text>
          </Pressable>
        </View>

        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <IconSymbol name="search" size={16} color={BrandColors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo khách hàng, mã đơn, địa chỉ..."
              placeholderTextColor={BrandColors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <IconSymbol name="close" size={14} color={BrandColors.gray400} />
              </Pressable>
            ) : null}
          </View>

          {/* District Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtChips}
          >
            {districts.map((d) => {
              const selected = selectedDistrict === d;
              return (
                <Pressable
                  key={d}
                  style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => setSelectedDistrict(d)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>{d}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* List of Shifts */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="calendar" size={44} color={BrandColors.gray300} />
              <Text style={styles.emptyTitle}>Không có ca làm việc nào</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'upcoming'
                  ? 'Bạn chưa có ca làm việc nào sắp tới. Hãy chuyển sang tab "Việc mới" để nhận thêm ca.'
                  : activeTab === 'open'
                  ? 'Hiện không có ca việc mới phù hợp với bộ lọc.'
                  : 'Chưa có lịch sử ca hoàn thành.'}
              </Text>
            </View>
          ) : (
            filteredList.map((job) => {
              const badge = getStatusBadge(job.status);
              return (
                <View key={job.id} style={styles.jobCard}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <View style={styles.serviceRow}>
                      <View style={styles.serviceIconWrap}>
                        <IconSymbol
                          name={job.serviceIcon || 'clean'}
                          size={18}
                          color="#047857"
                        />
                      </View>
                      <View>
                        <Text style={styles.serviceName}>{job.serviceName}</Text>
                        <Text style={styles.bookingCode}>{job.bookingCode}</Text>
                      </View>
                    </View>

                    {activeTab !== 'open' && (
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    )}

                    {activeTab === 'open' && (
                      <Text style={styles.openNetIncome}>
                        +{job.netIncome.toLocaleString('vi-VN')}đ
                      </Text>
                    )}
                  </View>

                  <Text style={styles.packageTitle}>{job.packageTitle}</Text>

                  {/* Customer and timing */}
                  <View style={styles.jobMetaBox}>
                    <View style={styles.jobMetaRow}>
                      <Text style={styles.metaIcon}>⏱️</Text>
                      <Text style={styles.metaText}>
                        {job.date} • <Text style={styles.metaBold}>{job.timeSlot}</Text>
                      </Text>
                    </View>

                    <View style={styles.jobMetaRow}>
                      <Text style={styles.metaIcon}>📍</Text>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {job.address} ({job.district})
                      </Text>
                    </View>

                    <View style={styles.jobMetaRow}>
                      <Text style={styles.metaIcon}>👤</Text>
                      <Text style={styles.metaText}>
                        Khách: {job.customerName} • Cách bạn{' '}
                        <Text style={styles.distanceText}>{job.distanceKm} km</Text>
                      </Text>
                    </View>
                  </View>

                  {job.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText} numberOfLines={2}>
                        📝 {job.notes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Financial summary on card */}
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Thu nhập thực nhận:</Text>
                    <Text style={styles.financialAmount}>
                      {job.netIncome.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    {activeTab === 'open' ? (
                      <>
                        <Pressable
                          style={styles.secondaryBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/staff/job-detail',
                              params: { id: job.id },
                            })
                          }
                        >
                          <Text style={styles.secondaryBtnText}>Xem chi tiết</Text>
                        </Pressable>
                        <Pressable
                          style={styles.primaryClaimBtn}
                          onPress={() => handleClaim(job)}
                        >
                          <Text style={styles.primaryClaimBtnText}>Nhận ca này</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        {job.conversationId ? (
                          <Pressable
                            style={styles.chatBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/chat/[id]',
                                params: { id: job.conversationId || '' },
                              })
                            }
                          >
                            <IconSymbol name="chat" size={16} color="#047857" />
                            <Text style={styles.chatBtnText}>Chat</Text>
                          </Pressable>
                        ) : null}

                        <Pressable
                          style={styles.primaryActionBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/staff/job-detail',
                              params: { id: job.id },
                            })
                          }
                        >
                          <Text style={styles.primaryActionBtnText}>
                            {job.status === 'IN_PROGRESS'
                              ? 'Tiếp tục làm việc ⚡'
                              : job.status === 'EN_ROUTE'
                              ? 'Cập nhật đã đến nơi 📍'
                              : job.status === 'COMPLETED'
                              ? 'Xem lại nghiệm thu'
                              : 'Bắt đầu di chuyển →'}
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Persistent Staff Bottom Nav */}
      <StaffBottomNav activeTab="jobs" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: BrandColors.gray900 },
  badgeCounter: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCounterText: { color: '#047857', fontSize: 11, fontWeight: '800' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: { backgroundColor: '#047857' },
  tabButtonText: { fontSize: 12, fontWeight: '700', color: BrandColors.gray600 },
  tabButtonTextActive: { color: '#FFFFFF', fontWeight: '800' },

  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: BrandColors.gray800 },
  districtChips: { gap: 6, paddingTop: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  chipText: { fontSize: 11, color: BrandColors.gray600, fontWeight: '600' },
  chipTextActive: { color: '#047857', fontWeight: '800' },

  scrollContent: { padding: 14, gap: 12, paddingBottom: 20 },

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: BrandColors.gray800 },
  emptySub: {
    fontSize: 12,
    color: BrandColors.gray500,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: 14, fontWeight: '900', color: BrandColors.gray900 },
  bookingCode: { fontSize: 11, color: BrandColors.gray500, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  openNetIncome: { fontSize: 16, fontWeight: '900', color: '#047857' },

  packageTitle: { fontSize: 14, fontWeight: '800', color: BrandColors.gray800 },

  jobMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 12, color: BrandColors.gray700, flex: 1 },
  metaBold: { fontWeight: '800', color: BrandColors.gray900 },
  distanceText: { color: '#2563EB', fontWeight: '800' },

  notesBox: {
    backgroundColor: '#FEFCE8',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesText: { fontSize: 11, color: '#92400E' },

  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  financialLabel: { fontSize: 12, color: BrandColors.gray500 },
  financialAmount: { fontSize: 15, fontWeight: '900', color: '#047857' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '800', color: BrandColors.gray700 },
  primaryClaimBtn: {
    flex: 2,
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryClaimBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chatBtnText: { fontSize: 12, fontWeight: '800', color: '#047857' },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
});
