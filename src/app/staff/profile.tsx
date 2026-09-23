import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';

export default function StaffProfileScreen() {
  const router = useRouter();
  const { currentStaff, logout } = useAuth();

  const staff = currentStaff || {
    fullName: 'Nguyễn Thị Hoa',
    phone: '0912 001 001',
    email: 'hoa.nguyen.staff@homecare.vn',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    experienceYears: 5,
    rating: 4.92,
    reviewCount: 248,
    completionRate: 99,
    satisfactionRate: 99,
    completedBookingsCount: 312,
    idCardNumber: '001089012345',
    specialties: ['Vệ sinh nhà theo giờ', 'Dọn dẹp căn hộ', 'Vệ sinh sofa & rèm'],
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản đối tác?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ & Đánh giá</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Staff Hero Identity Card */}
          <Pressable style={styles.identityCard} onPress={() => router.push('/staff/personal-info')}>
            <View style={styles.identityTop}>
              <Image source={{ uri: staff.avatar }} style={styles.avatar} />
              <View style={styles.identityInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.staffName}>{staff.fullName}</Text>
                  <View style={styles.badgeVerified}>
                    <Text style={styles.badgeVerifiedText}>✓ CCCD Đã duyệt</Text>
                  </View>
                </View>
                <Text style={styles.staffMeta}>Mã NV: NV-001 • {staff.experienceYears} năm kinh nghiệm</Text>
                <Text style={styles.staffContact}>📞 {staff.phone}</Text>
              </View>
            </View>

            <View style={styles.identityDivider} />

            {/* Performance KPI Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiItem}>
                <View style={styles.kpiStarRow}>
                  <Text style={styles.kpiValue}>4.92</Text>
                  <Text style={styles.kpiStar}>★</Text>
                </View>
                <Text style={styles.kpiLabel}>248 đánh giá</Text>
              </View>

              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>99%</Text>
                <Text style={styles.kpiLabel}>Tỷ lệ hoàn thành</Text>
              </View>

              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>99%</Text>
                <Text style={styles.kpiLabel}>Hài lòng 5★</Text>
              </View>

              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>312</Text>
                <Text style={styles.kpiLabel}>Ca thành công</Text>
              </View>
            </View>
            <View style={styles.editProfileHint}>
              <Text style={styles.editProfileHintText}>Chạm để xem và cập nhật thông tin cá nhân</Text>
              <Text style={styles.editProfileHintArrow}>›</Text>
            </View>
          </Pressable>

          {/* Account Utilities / Switch Role */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Cài đặt & Tiện ích</Text>

            <Pressable style={styles.utilityRow} onPress={() => router.push('/staff/account-details?section=badges' as never)}>
              <View style={styles.utilityIconWrap}><IconSymbol name="award" size={18} color="#D97706" /></View>
              <View style={styles.utilityCopy}><Text style={styles.utilityTitle}>Huy hiệu khen ngợi</Text><Text style={styles.utilitySubtitle}>Các điểm mạnh từ khách hàng</Text></View>
              <Text style={styles.utilityArrow}>›</Text>
            </Pressable>

            <Pressable style={styles.utilityRow} onPress={() => router.push('/staff/account-details?section=skills' as never)}>
              <View style={styles.utilityIconWrap}><IconSymbol name="success" size={18} color="#047857" /></View>
              <View style={styles.utilityCopy}><Text style={styles.utilityTitle}>Kỹ năng & chuyên môn</Text><Text style={styles.utilitySubtitle}>Dịch vụ bạn đã đăng ký</Text></View>
              <Text style={styles.utilityArrow}>›</Text>
            </Pressable>

            <Pressable style={styles.utilityRow} onPress={() => router.push('/staff/account-details?section=reviews' as never)}>
              <View style={styles.utilityIconWrap}><IconSymbol name="message" size={18} color="#2563EB" /></View>
              <View style={styles.utilityCopy}><Text style={styles.utilityTitle}>Nhận xét từ khách hàng</Text><Text style={styles.utilitySubtitle}>Xem 4 nhận xét gần đây</Text></View>
              <Text style={styles.utilityArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.utilityRow}
              onPress={() => router.push('/staff/availability')}
            >
              <View style={styles.utilityIconWrap}>
                <IconSymbol name="calendar" size={18} color="#047857" />
              </View>
              <Text style={styles.utilityTitle}>Đăng ký lịch làm & khu vực</Text>
              <Text style={styles.utilityArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.utilityRow}
              onPress={() =>
                Alert.alert(
                  'Hồ sơ pháp lý & Chứng nhận',
                  '• Căn cước công dân số: 001089012345 (Đã duyệt)\n• Giấy xác nhận hạnh kiểm: Đạt chuẩn\n• Khóa đào tạo nghiệp vụ 5 sao: Đã tốt nghiệp loại Giỏi.'
                )
              }
            >
              <View style={styles.utilityIconWrap}>
                <IconSymbol name="shield" size={18} color="#0369A1" />
              </View>
              <Text style={styles.utilityTitle}>Chứng nhận nghiệp vụ & Pháp lý</Text>
              <Text style={styles.utilityArrow}>›</Text>
            </Pressable>
          </View>

          {/* Prominent Logout Button */}
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            android_ripple={{ color: '#FEE2E2' }}
          >
            <View style={styles.logoutIconWrap}>
              <IconSymbol name="close" size={18} color="#DC2626" />
            </View>
            <View style={styles.logoutTextWrap}>
              <Text style={styles.logoutTitle}>Đăng xuất tài khoản</Text>
              <Text style={styles.logoutSubtitle}>Thoát phiên làm việc của đối tác</Text>
            </View>
            <Text style={styles.logoutArrow}>→</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Staff Bottom Nav */}
      <StaffBottomNav activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: BrandColors.gray900 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 16, gap: 14, paddingBottom: 24 },

  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#10B981' },
  identityInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  staffName: { fontSize: 17, fontWeight: '900', color: BrandColors.gray900 },
  badgeVerified: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeVerifiedText: { color: '#047857', fontSize: 10, fontWeight: '800' },
  staffMeta: { fontSize: 12, color: BrandColors.gray500, marginTop: 3 },
  staffContact: { fontSize: 12, color: BrandColors.gray600, marginTop: 2 },
  identityDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiStarRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  kpiValue: { fontSize: 16, fontWeight: '900', color: BrandColors.gray900 },
  kpiStar: { color: '#F59E0B', fontSize: 16, fontWeight: '900' },
  kpiLabel: { fontSize: 10, color: BrandColors.gray500, marginTop: 2, textAlign: 'center' },
  editProfileHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  editProfileHintText: { color: '#047857', fontSize: 11, fontWeight: '800' },
  editProfileHintArrow: { color: '#047857', fontSize: 20, lineHeight: 20 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardSectionTitle: { fontSize: 14, fontWeight: '900', color: BrandColors.gray900 },

  praiseWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  praiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  praiseIcon: { fontSize: 13 },
  praiseLabel: { fontSize: 12, fontWeight: '700', color: '#166534' },
  praiseCount: { fontSize: 11, color: '#15803D', fontWeight: '800' },

  skillsWrap: { gap: 8 },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  skillCheck: { color: '#047857', fontSize: 14, fontWeight: '900' },
  skillTitle: { fontSize: 13, fontWeight: '700', color: BrandColors.gray800 },

  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewCount: { fontSize: 12, color: BrandColors.gray500 },
  noReviews: { fontSize: 12, color: BrandColors.gray500, fontStyle: 'italic' },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerAvatar: { width: 34, height: 34, borderRadius: 17 },
  reviewerName: { fontSize: 13, fontWeight: '800', color: BrandColors.gray900 },
  reviewDate: { fontSize: 10, color: BrandColors.gray400 },
  starsRow: { flexDirection: 'row' },
  starIcon: { fontSize: 12 },
  reviewComment: { fontSize: 12, color: BrandColors.gray700, lineHeight: 18 },

  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  utilityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: BrandColors.gray800 },
  utilityCopy: { flex: 1 },
  utilitySubtitle: { color: BrandColors.gray500, fontSize: 11, marginTop: 2 },
  utilityArrow: { fontSize: 18, color: BrandColors.gray400 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 15,
    marginTop: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTextWrap: { flex: 1 },
  logoutTitle: { fontSize: 15, fontWeight: '900', color: '#DC2626' },
  logoutSubtitle: { fontSize: 11, color: '#991B1B', marginTop: 2, fontWeight: '600' },
  logoutArrow: { fontSize: 18, fontWeight: '900', color: '#DC2626' },
});
