import { BookingChatLink } from '@/components/common/BookingChatLink';
import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { StaffService, StaffJobItem } from '@/data/staffService';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useStaffMatching } from '@/hooks/use-staff-matching';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';
import { selectMatchingItems } from '@/data/staffMatchingRules';
import { localDate } from '@/data/staffAvailabilityRules';
import { StaffMatchingList, MatchingSortPicker, DEFAULT_MATCH_FILTER } from '@/components/staff/StaffMatchingList';
import { EmptyState } from '@/components/common/EmptyState';
import { MatchingModePicker, matchingModeCounts } from '@/components/staff/MatchingModePicker';

type TabKey = 'upcoming' | 'open' | 'completed';

export default function StaffJobsScreen() {
  const { currentUser, currentStaff } = useAuth();
  const router = useRouter();
  if (!getCapabilityActor(currentUser, currentStaff)) return <SafeAreaView style={{ flex: 1 }}><EmptyState icon="shield" title="Vui lòng đăng nhập nhân viên" actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} /></SafeAreaView>;
  return <StaffJobsContent key={currentUser!.id} />;
}
function StaffJobsContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; source?: string }>();
  const { currentStaff } = useAuth();
  const staffId = currentStaff!.id;
  const matching = useStaffMatching();
  const [matchMode, setMatchMode] = useState<'A' | 'B'>(params.source === 'A' ? 'A' : 'B');
  const counts = matchingModeCounts(matching.data);
  const [sort, setSort] = useState(DEFAULT_MATCH_FILTER.sort);
  const matchCount = matching.data ? selectMatchingItems(matching.data, DEFAULT_MATCH_FILTER).length : 0;

  const [activeTab, setActiveTab] = useState<TabKey>(
    params.tab === 'open' ? 'open' : params.tab === 'completed' ? 'completed' : 'upcoming'
  );
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => { if (params.tab === 'open') setActiveTab('open'); if (params.source === 'A' || params.source === 'B') setMatchMode(params.source); }, [params.tab, params.source]);
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [jobs, setJobs] = useState<StaffJobItem[]>([]);

  useEffect(() => {
    const refreshData = () => {
      setJobs(StaffService.getJobs(staffId));
    };
    refreshData();
    const unsubscribe = StaffService.subscribe(refreshData);
    return unsubscribe;
  }, [staffId]);

  const upcomingList = jobs.filter(
    (j) => j.status === 'ACCEPTED' || j.status === 'EN_ROUTE' || j.status === 'IN_PROGRESS'
  );
  const completedList = jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'CANCELLED');

  const currentList = activeTab === 'upcoming' ? upcomingList : completedList;

  const opportunities = (matching.data?.items || []).filter(item => item.opportunity.mode === matchMode).map(item => item.opportunity);
  const districts = ['Tất cả', ...new Set([...opportunities.map(item => item.district), ...currentList.map(item => item.district)].filter(Boolean))];
  const services = [...new Map(opportunities.map(item => [item.serviceId, item.serviceName])).entries()];
  const dates = [...new Set(opportunities.map(item => localDate(item.startsAt)))].sort();

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

  const getStatusBadge = (status: StaffJobItem['status'] | 'OPEN') => {
    switch (status) {
      case 'OPEN':
        return { label: 'Ca việc mới', bg: '#ECFDF5', text: '#047857' };
      case 'IN_PROGRESS':
        return { label: 'Đang làm việc', bg: '#DCFCE7', text: '#15803D' };
      case 'EN_ROUTE':
        return { label: 'Đang di chuyển', bg: '#DBEAFE', text: '#1D4ED8' };
      case 'ACCEPTED':
        return { label: 'Đã nhận ca', bg: '#FEF3C7', text: '#B45309' };
      case 'CANCELLED':
        return { label: 'Đã hủy', bg: '#FEE2E2', text: '#B91C1C' };
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
              Việc mới ({matchCount})
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

        {activeTab === 'open' && <View style={{ paddingHorizontal: Spacing.three, paddingBottom: Spacing.two }}><MatchingModePicker value={matchMode} onChange={setMatchMode} invitations={counts.A} open={counts.B} /></View>}
        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <IconSymbol name="search" size={16} color={BrandColors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'open' ? 'Tìm dịch vụ, mã ca, khu vực...' : 'Tìm khách hàng, mã ca, địa chỉ...'}
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

        {activeTab === 'open' && <View style={{ padding: Spacing.two, gap: 8 }}>
          <Text style={{ color: BrandColors.gray500 }}>Việc đã lọc theo năng lực được duyệt, khu vực và lịch làm đã đăng ký của bạn.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[['', 'Mọi dịch vụ'], ...services].map(([id, name]) => <Pressable key={id} style={[styles.chip, selectedService === id && styles.chipActive]} onPress={() => setSelectedService(id)}><Text style={styles.chipText}>{name}</Text></Pressable>)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['', ...dates].map(date => <Pressable key={date} style={[styles.chip, selectedDate === date && styles.chipActive]} onPress={() => setSelectedDate(date)}><Text style={styles.chipText}>{date ? date.split('-').reverse().join('/') : 'Mọi ngày'}</Text></Pressable>)}
          </ScrollView>
          <MatchingSortPicker value={sort} onChange={setSort} />
        </View>}
        {/* List of Shifts */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        >
          {activeTab === 'open' ? <StaffMatchingList matching={matching} filter={{ query: searchQuery, district: selectedDistrict, sort, mode: matchMode, serviceId: selectedService, date: selectedDate }} onResetFilters={() => { setSearchQuery(''); setSelectedDistrict('Tất cả'); setSelectedService(''); setSelectedDate(''); }} onClaimed={job => router.push({ pathname: '/staff/job-detail', params: { id: job.id } })} /> : filteredList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="calendar" size={44} color={BrandColors.gray300} />
              <Text style={styles.emptyTitle}>Không có ca làm việc nào</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'upcoming'
                  ? 'Bạn chưa có ca làm việc nào sắp tới. Hãy chuyển sang tab "Việc mới" để nhận thêm ca.'
                  : 'Chưa có lịch sử ca làm việc.'}
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

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                  </View>

                  <Text style={styles.packageTitle}>{job.packageTitle}</Text>

                  {/* Customer and timing */}
                  <View style={styles.jobMetaBox}>
                    <View style={styles.jobMetaRow}>
                      <IconSymbol name="⏱️" style={styles.metaIcon} />
                      <Text style={styles.metaText}>
                        {job.date} • <Text style={styles.metaBold}>{job.timeSlot}</Text>
                      </Text>
                    </View>

                    <View style={styles.jobMetaRow}>
                      <IconSymbol name="📍" style={styles.metaIcon} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {job.address} ({job.district})
                      </Text>
                    </View>

                    <View style={styles.jobMetaRow}>
                      <IconSymbol name="👤" style={styles.metaIcon} />
                      <Text style={styles.metaText}>
                        Khách: {job.customerName}
                      </Text>
                    </View>
                  </View>

                  {job.cancellationReason && <View style={styles.notesBox}><Text style={[styles.notesText, { color: '#B91C1C' }]}>{job.cancellationReason}</Text>
                    {job.responseTimedOut && <Text style={[styles.notesText, { color: '#92400E' }]}>Hãy chú ý lời mời và phản hồi sớm hơn để có doanh thu tốt hơn.</Text>}
                  </View>}
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
                        <BookingChatLink bookingId={job.id} staffId={staffId}
                          style={styles.chatBtn} textStyle={styles.chatBtnText} />

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
                              : job.status === 'CANCELLED' ? 'Xem lịch sử hủy'
                              : 'Bắt đầu di chuyển →'}
                          </Text>
                        </Pressable>
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
