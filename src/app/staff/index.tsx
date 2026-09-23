import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';

const OPEN_SHIFTS = [
  { id: 'shift-1', service: 'Vệ sinh nhà theo giờ', time: 'Hôm nay · 14:00 - 17:00', area: 'Bình Thạnh, TP.HCM', income: '288.000đ', distance: '1,8 km' },
  { id: 'shift-2', service: 'Tổng vệ sinh căn hộ', time: 'Ngày mai · 08:00 - 12:00', area: 'Quận 7, TP.HCM', income: '560.000đ', distance: '4,2 km' },
];

export default function StaffDashboard() {
  const router = useRouter();
  const { currentStaff, logout } = useAuth();
  const [acceptedShiftIds, setAcceptedShiftIds] = useState<string[]>([]);
  const staffName = currentStaff?.fullName || 'Nhân viên';

  const acceptShift = (id: string) => {
    setAcceptedShiftIds((current) => [...current, id]);
    Alert.alert('Đã gửi yêu cầu nhận ca', 'Hệ thống sẽ xác nhận ca này ngay khi còn khả dụng.');
  };

  return <LinearGradient colors={['#ECFDF5', '#F8FAFC', '#FFFFFF']} style={styles.gradient}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.greeting}>Chào {staffName.split(' ').slice(-1)[0]} 👋</Text><Text style={styles.subGreeting}>Sẵn sàng cho một ngày làm việc hiệu quả</Text></View>
          <Pressable style={styles.notification}><IconSymbol name="bell" size={20} color={BrandColors.gray700} /><View style={styles.notificationDot} /></Pressable>
        </View>

        <LinearGradient colors={['#0F766E', '#059669']} style={styles.availabilityCard}>
          <View style={styles.availabilityHeader}><View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Đang sẵn sàng nhận ca</Text></View><Text style={styles.verified}>Đã xác thực ✓</Text></View>
          <Text style={styles.availabilityTitle}>Hồ sơ của bạn đang hiển thị tại TP.HCM</Text>
          <Text style={styles.availabilityMeta}>Khu vực: Bình Thạnh · Quận 1 · Quận 3</Text>
          <Pressable style={styles.manageAvailability}><Text style={styles.manageAvailabilityText}>Quản lý lịch rảnh</Text><Text style={styles.manageAvailabilityArrow}>›</Text></Pressable>
        </LinearGradient>

        <View style={styles.metrics}>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>Thu nhập tuần này</Text><Text style={styles.metricValue}>2,48tr</Text><Text style={styles.metricTrend}>↑ 12% so với tuần trước</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>Giờ đã làm</Text><Text style={styles.metricValue}>18,5h</Text><Text style={styles.metricTrend}>6 ca đã hoàn thành</Text></View>
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Ca phù hợp với bạn</Text><Text style={styles.sectionSubtitle}>Dựa trên khu vực và kỹ năng đã đăng ký</Text></View><Text style={styles.countPill}>{OPEN_SHIFTS.length} ca mới</Text></View>
        {OPEN_SHIFTS.map((shift) => {
          const accepted = acceptedShiftIds.includes(shift.id);
          return <View key={shift.id} style={styles.shiftCard}>
            <View style={styles.shiftTop}><View style={styles.serviceIcon}><IconSymbol name="clean" size={20} color="#047857" /></View><View style={styles.shiftTitleWrap}><Text style={styles.shiftService}>{shift.service}</Text><Text style={styles.shiftTime}>{shift.time}</Text></View><Text style={styles.shiftIncome}>{shift.income}</Text></View>
            <View style={styles.shiftDetails}><Text style={styles.shiftDetail}>📍 {shift.area}</Text><Text style={styles.shiftDetail}>🚶 Cách bạn {shift.distance}</Text></View>
            <Pressable disabled={accepted} onPress={() => acceptShift(shift.id)} style={[styles.acceptButton, accepted && styles.acceptedButton]}><Text style={[styles.acceptButtonText, accepted && styles.acceptedButtonText]}>{accepted ? 'Đã gửi yêu cầu nhận ca' : 'Nhận ca này'}</Text></Pressable>
          </View>;
        })}

        <Text style={styles.sectionTitle}>Công việc của tôi</Text>
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickItem}><IconSymbol name="calendar" size={23} color="#2563EB" /><Text style={styles.quickTitle}>Lịch làm việc</Text><Text style={styles.quickSubtitle}>2 ca sắp tới</Text></Pressable>
          <Pressable style={styles.quickItem}><IconSymbol name="wallet" size={23} color="#D97706" /><Text style={styles.quickTitle}>Thu nhập</Text><Text style={styles.quickSubtitle}>Thưởng & đối soát</Text></Pressable>
          <Pressable style={styles.quickItem}><IconSymbol name="location" size={23} color="#7C3AED" /><Text style={styles.quickTitle}>Khu vực hoạt động</Text><Text style={styles.quickSubtitle}>3 khu vực đã chọn</Text></Pressable>
          <Pressable style={styles.quickItem} onPress={() => { logout(); router.replace('/auth/login'); }}><IconSymbol name="user" size={23} color="#475569" /><Text style={styles.quickTitle}>Tài khoản</Text><Text style={styles.quickSubtitle}>Thông tin cá nhân</Text></Pressable>
        </View>

        <View style={styles.policyNote}><IconSymbol name="shield" size={18} color="#0369A1" /><Text style={styles.policyText}>Thông tin liên hệ khách hàng chỉ được mở trong chat của ca đã xác nhận.</Text></View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  gradient: { flex: 1 }, safeArea: { flex: 1 }, content: { padding: Spacing.four, paddingBottom: 34, gap: 14 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }, greeting: { color: BrandColors.gray900, fontSize: 23, fontWeight: '900' }, subGreeting: { color: BrandColors.gray600, fontSize: 12, marginTop: 3 }, notification: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }, notificationDot: { position: 'absolute', right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  availabilityCard: { borderRadius: 20, padding: 17, shadowColor: '#047857', shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 }, availabilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A7F3D0' }, onlineText: { color: '#ECFDF5', fontSize: 12, fontWeight: '800' }, verified: { color: '#D1FAE5', fontSize: 11, fontWeight: '700' }, availabilityTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 17 }, availabilityMeta: { color: '#D1FAE5', fontSize: 12, marginTop: 5 }, manageAvailability: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' }, manageAvailabilityText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, manageAvailabilityArrow: { color: '#FFFFFF', fontSize: 24, lineHeight: 25 },
  metrics: { flexDirection: 'row', gap: 11 }, metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#E2E8F0' }, metricLabel: { color: BrandColors.gray500, fontSize: 11, fontWeight: '700' }, metricValue: { color: BrandColors.gray900, fontSize: 21, fontWeight: '900', marginTop: 6 }, metricTrend: { color: '#059669', fontSize: 10, marginTop: 5, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }, sectionTitle: { color: BrandColors.gray900, fontSize: 17, fontWeight: '900' }, sectionSubtitle: { color: BrandColors.gray500, fontSize: 11, marginTop: 3 }, countPill: { color: '#047857', backgroundColor: '#D1FAE5', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, fontSize: 10, fontWeight: '800' },
  shiftCard: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 14, borderWidth: 1, borderColor: '#DDEBE6' }, shiftTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, serviceIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' }, shiftTitleWrap: { flex: 1 }, shiftService: { color: BrandColors.gray900, fontSize: 14, fontWeight: '900' }, shiftTime: { color: BrandColors.gray600, fontSize: 11, marginTop: 3 }, shiftIncome: { color: '#047857', fontSize: 14, fontWeight: '900' }, shiftDetails: { gap: 4, marginTop: 12 }, shiftDetail: { color: BrandColors.gray600, fontSize: 11 }, acceptButton: { marginTop: 13, minHeight: 39, borderRadius: 10, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }, acceptButtonText: { color: '#047857', fontSize: 12, fontWeight: '900' }, acceptedButton: { backgroundColor: '#F1F5F9' }, acceptedButtonText: { color: '#64748B' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, quickItem: { width: '48.5%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 15, padding: 13, minHeight: 104 }, quickTitle: { color: BrandColors.gray800, fontSize: 12, fontWeight: '900', marginTop: 10 }, quickSubtitle: { color: BrandColors.gray500, fontSize: 10, marginTop: 4 }, policyNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#F0F9FF', alignItems: 'flex-start' }, policyText: { flex: 1, color: '#075985', fontSize: 11, lineHeight: 16 },
});
