import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { getAddressesByCustomerId } from '@/data';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    currentCustomer,
    currentStaff,
    currentRole,
    switchRole,
    logout,
  } = useAuth();

  const isCustomer = currentRole === 'CUSTOMER';
  const addresses = currentCustomer ? getAddressesByCustomerId(currentCustomer.id) : [];

  const handleRoleToggle = () => {
    const nextRole = isCustomer ? 'STAFF' : 'CUSTOMER';
    switchRole(nextRole);
    Alert.alert(
      'Chuyển đổi vai trò',
      `Bạn hiện đang sử dụng giao diện ${
        nextRole === 'CUSTOMER' ? 'Khách hàng đặt dịch vụ' : 'Nhân viên giúp việc đối tác'
      }.`
    );
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
          router.push('/auth/login');
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isCustomer ? 'Tài khoản khách hàng' : 'Hồ sơ đối tác nhân viên'}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {/* User Profile Card */}
          <View style={styles.userCard}>
            <Image
              source={{
                uri:
                  (isCustomer ? currentCustomer?.avatar : currentStaff?.avatar) ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>
                  {(isCustomer ? currentCustomer?.fullName : currentStaff?.fullName) ||
                    'Người dùng'}
                </Text>
                <Badge
                  label={isCustomer ? 'Khách hàng' : 'Đối tác tự do'}
                  variant={isCustomer ? 'primary' : 'success'}
                  size="sm"
                />
              </View>
              <Text style={styles.userPhone}>
                {(isCustomer ? currentCustomer?.phone : currentStaff?.phone) ||
                  '0901234001'}
              </Text>
              <Text style={styles.userSub}>
                {isCustomer
                  ? 'Thành viên gắn bó HomeCare'
                  : 'CCCD đã xác minh • Giúp việc gia đình'}
              </Text>
            </View>
          </View>

          {/* The account role is fixed in production. This switch is available only to review both mock flows. */}
          {__DEV__ && (
            <View style={styles.roleSwitcherCard}>
              <View style={styles.roleSwitcherInfo}>
                <Text style={styles.roleSwitcherTitle}>
                  Xem trước vai trò:{' '}
                  <Text style={{ color: BrandColors.primary, fontWeight: '800' }}>
                    {isCustomer ? 'KHÁCH HÀNG' : 'NHÂN VIÊN GIÚP VIỆC'}
                  </Text>
                </Text>
                <Text style={styles.roleSwitcherSub}>
                  Chỉ dùng để xem dữ liệu mẫu; tài khoản thực tế không thể đổi vai trò trong ứng dụng.
                </Text>
              </View>

              <Pressable style={styles.switchRoleBtn} onPress={handleRoleToggle}>
                <Text style={styles.switchRoleBtnText}>
                  {isCustomer ? 'Xem Staff' : 'Xem Khách'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* ========================================================= */}
          {/* ==================== STAFF VIEW ========================= */}
          {/* ========================================================= */}
          {!isCustomer && (
            <View>
              {/* Financial Breakdown (Section 18, 19, 20) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>Ví & Thu nhập đối tác</Text>
                  <Badge label="Nền tảng 20% • Thợ 80%" variant="primary" size="sm" />
                </View>

                {/* Guaranteed Balance (Min 200,000 VND) */}
                <View style={styles.balanceHighlightBox}>
                  <View>
                    <Text style={styles.balanceHighlightLabel}>Số dư đảm bảo (Ký quỹ nhận việc)</Text>
                    <Text style={styles.balanceHighlightValue}>{formatVND(450000)}</Text>
                    <Text style={styles.balanceMinNotice}>Mức số dư tối thiểu: 200.000đ</Text>
                  </View>
                  <Pressable
                    style={styles.withdrawBtn}
                    onPress={() =>
                      Alert.alert(
                        'Rút tiền',
                        'Nhân viên có thể rút số dư đảm bảo về tài khoản ngân hàng khi nghỉ hoặc ngừng hoạt động theo quy định.'
                      )
                    }>
                    <Text style={styles.withdrawBtnText}>Rút tiền</Text>
                  </Pressable>
                </View>

                {/* Earnings List */}
                <View style={styles.earningRow}>
                  <Text style={styles.earningLabel}>Thu nhập ròng (80% giá trị đơn):</Text>
                  <Text style={styles.earningValue}>{formatVND(12450000)}</Text>
                </View>

                <View style={styles.earningRow}>
                  <Text style={styles.earningLabel}>Phí nền tảng đã nộp (20%):</Text>
                  <Text style={styles.earningValue}>{formatVND(3112500)}</Text>
                </View>

                <View style={styles.earningRow}>
                  <Text style={styles.earningLabel}>Tiền Tip nhận trực tiếp (100%):</Text>
                  <Text style={[styles.earningValue, { color: BrandColors.success }]}>
                    +{formatVND(850000)}
                  </Text>
                </View>

                <View style={styles.earningRow}>
                  <Text style={styles.earningLabel}>Đơn Vắng mặt (Ghi nhận 1h công/đơn):</Text>
                  <Text style={styles.earningValue}>2 ca (đã cộng thu nhập)</Text>
                </View>
              </View>

              {/* Bonus Policy Dashboard (Section 23) */}
              <View style={[styles.sectionCard, { marginTop: Spacing.three }]}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>Chính sách thưởng doanh thu</Text>
                  <Badge label="Theo quy định ABC" variant="warning" size="sm" />
                </View>

                <View style={styles.bonusItem}>
                  <Text style={styles.bonusItemTitle}>🌟 Thưởng ngày (100.000đ/ngày)</Text>
                  <Text style={styles.bonusItemDesc}>
                    Doanh thu từ 800.000đ trở lên và cao nhất trong ngày (1 nhân viên/ngày).
                  </Text>
                </View>

                <View style={styles.bonusItem}>
                  <Text style={styles.bonusItemTitle}>🏆 Thưởng tháng (Top 3 doanh thu)</Text>
                  <Text style={styles.bonusItemDesc}>
                    Hạng 1: 2.500.000đ • Hạng 2: 1.500.000đ • Hạng 3: 1.000.000đ.
                  </Text>
                </View>

                <View style={styles.bonusItem}>
                  <Text style={styles.bonusItemTitle}>👑 Thưởng quý (Top 3 doanh thu quý)</Text>
                  <Text style={styles.bonusItemDesc}>
                    Hạng 1: 5.000.000đ • Hạng 2: 3.500.000đ • Hạng 3: 2.000.000đ.
                  </Text>
                </View>
              </View>

              {/* Restriction & Account Standing (Section 22) */}
              <View style={[styles.sectionCard, { marginTop: Spacing.three }]}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>Tình trạng tài khoản & Kỷ luật</Text>
                  <Badge label="Bình thường" variant="success" size="sm" />
                </View>

                <Text style={styles.standingDesc}>
                  Chính sách kiểm soát việc hủy đơn: Nhân viên bị hạn chế hoặc tạm khóa nếu hủy 2 đơn liên tiếp hoặc trên 3 đơn trong tháng.
                </Text>

                <View style={styles.standingStatsRow}>
                  <View style={styles.standingStatCol}>
                    <Text style={styles.standingStatVal}>0</Text>
                    <Text style={styles.standingStatLbl}>Hủy tháng này</Text>
                  </View>
                  <View style={styles.standingStatCol}>
                    <Text style={styles.standingStatVal}>98%</Text>
                    <Text style={styles.standingStatLbl}>Tỷ lệ hoàn thành</Text>
                  </View>
                  <View style={styles.standingStatCol}>
                    <Text style={styles.standingStatVal}>4.8★</Text>
                    <Text style={styles.standingStatLbl}>Đánh giá TB</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* =================== CUSTOMER VIEW ======================= */}
          {/* ========================================================= */}
          {isCustomer && (
            <View>
              {/* Customer Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{currentCustomer?.totalBookings || 14}</Text>
                  <Text style={styles.statLabel}>Đơn đã đặt</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{addresses.length}</Text>
                  <Text style={styles.statLabel}>Địa chỉ lưu</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>100%</Text>
                  <Text style={styles.statLabel}>Bảo hiểm đơn</Text>
                </View>
              </View>

              {/* Customer Menu */}
              <View style={styles.menuGroup}>
                <Text style={styles.menuGroupTitle}>Quản lý đặt dịch vụ</Text>

                <Pressable
                  style={styles.menuItem}
                  onPress={() =>
                    Alert.alert(
                      'Sổ địa chỉ',
                      `Bạn đang có ${addresses.length} địa chỉ. Khách hàng chọn địa chỉ trước khi đặt đơn để hệ thống đề xuất thợ phù hợp (Section 6).`
                    )
                  }>
                  <View style={styles.menuIconBox}>
                    <IconSymbol name="location" size={16} color={BrandColors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Sổ địa chỉ của tôi</Text>
                  <IconSymbol name="chevronRight" size={14} color={BrandColors.gray400} />
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => router.push('/bookings')}>
                  <View style={styles.menuIconBox}>
                    <IconSymbol name="receipt" size={16} color={BrandColors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Đơn hàng & Hóa đơn</Text>
                  <IconSymbol name="chevronRight" size={14} color={BrandColors.gray400} />
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => router.push('/ai')}>
                  <View style={styles.menuIconBox}>
                    <IconSymbol name="bot" size={16} color={BrandColors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Trợ lý AI tư vấn dịch vụ (Section 28)</Text>
                  <Badge label="24/7" variant="success" size="sm" />
                </Pressable>
              </View>
            </View>
          )}

          {/* General App Settings */}
          <View style={[styles.menuGroup, { marginTop: Spacing.three }]}>
            <Text style={styles.menuGroupTitle}>Hỗ trợ & Nền tảng</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() =>
                Alert.alert('Tổng đài hỗ trợ', 'Hotline chăm sóc khách hàng & đối tác: 1900 6868')
              }>
              <View style={styles.menuIconBox}>
                <IconSymbol name="phone" size={16} color={BrandColors.gray600} />
              </View>
              <Text style={styles.menuItemText}>Tổng đài hỗ trợ 1900 6868</Text>
              <IconSymbol name="chevronRight" size={14} color={BrandColors.gray400} />
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() =>
                Alert.alert(
                  'Quy chế nền tảng ABC',
                  'Giao dịch minh bạch, bảo mật thông tin liên hệ riêng, bồi thường trách nhiệm cho mọi đơn dịch vụ.'
                )
              }>
              <View style={styles.menuIconBox}>
                <IconSymbol name="shield" size={16} color={BrandColors.gray600} />
              </View>
              <Text style={styles.menuItemText}>Quy chế hoạt động & Bảo mật</Text>
              <IconSymbol name="chevronRight" size={14} color={BrandColors.gray400} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <View style={[styles.menuIconBox, { backgroundColor: BrandColors.dangerLight }]}>
                <IconSymbol name="close" size={14} color={BrandColors.danger} />
              </View>
              <Text style={[styles.menuItemText, { color: BrandColors.danger }]}>
                Đăng xuất
              </Text>
              <IconSymbol name="chevronRight" size={14} color={BrandColors.danger} />
            </Pressable>
          </View>

          <Text style={styles.versionText}>
            Hệ thống Quản lý Dịch vụ Giúp việc Gia đình ABC • v1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.two,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Spacing.two,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  userPhone: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  userSub: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  roleSwitcherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.three,
  },
  roleSwitcherInfo: {
    flex: 1,
    marginRight: Spacing.two,
  },
  roleSwitcherTitle: {
    fontSize: 12,
    color: BrandColors.gray800,
  },
  roleSwitcherSub: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  switchRoleBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  switchRoleBtnText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Staff Section Cards
  sectionCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  balanceHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.two,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  balanceHighlightLabel: {
    fontSize: 11,
    color: BrandColors.gray600,
  },
  balanceHighlightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primaryDark,
    marginTop: 2,
  },
  balanceMinNotice: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  withdrawBtn: {
    borderWidth: 1,
    borderColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  earningLabel: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  earningValue: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },

  // Bonus
  bonusItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  bonusItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  bonusItemDesc: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginTop: 2,
    lineHeight: 15,
  },

  // Standing
  standingDesc: {
    fontSize: 11,
    color: BrandColors.gray600,
    lineHeight: 15,
    marginBottom: Spacing.two,
  },
  standingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
  },
  standingStatCol: {
    alignItems: 'center',
  },
  standingStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  standingStatLbl: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 2,
  },

  // Customer Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.three,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: BrandColors.gray200,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },

  // Menu
  menuGroup: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  menuGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.gray400,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: BrandColors.gray400,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
});
