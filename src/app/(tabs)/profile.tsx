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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { getAddressesByCustomerId, mockBookings, mockReviews } from '@/data';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentCustomer, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const addresses = currentCustomer ? getAddressesByCustomerId(currentCustomer.id) : [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const completedCount = mockBookings.filter(
    (b) => b.customerId === currentCustomer?.id && b.status === 'COMPLETED'
  ).length;

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Customer Profile Card */}
        <View style={styles.userCard}>
          <Image
            source={{
              uri:
                currentCustomer?.avatar ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{currentCustomer?.fullName || 'Khách hàng'}</Text>
              <Badge label="Thành viên VIP" variant="primary" size="sm" />
            </View>
            <Text style={styles.userPhone}>📱 {currentCustomer?.phone || '0901234001'}</Text>
            <Text style={styles.userEmail}>✉️ {currentCustomer?.email || 'khachhang@homecare.vn'}</Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Pressable
            style={styles.statBox}
            onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.statNum}>{completedCount}</Text>
            <Text style={styles.statLabel}>Đơn hoàn tất</Text>
          </Pressable>

          <View style={styles.statBox}>
            <Text style={styles.statNum}>{currentCustomer?.rewardPoints || 1250}</Text>
            <Text style={styles.statLabel}>Điểm thưởng</Text>
          </View>

          <Pressable
            style={styles.statBox}
            onPress={() => router.push('/account/addresses')}>
            <Text style={styles.statNum}>{addresses.length}</Text>
            <Text style={styles.statLabel}>Địa chỉ lưu</Text>
          </Pressable>
        </View>

        {/* SECTION 1: QUẢN LÝ DỊCH VỤ & TIỆN ÍCH */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Quản lý dịch vụ & cá nhân</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/account/addresses')}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>📍</Text>
              <View>
                <Text style={styles.menuLabel}>Sổ địa chỉ</Text>
                <Text numberOfLines={1} style={styles.menuSub}>
                  {defaultAddress ? defaultAddress.streetAddress : 'Thêm địa chỉ phục vụ'}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/bookings')}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>📋</Text>
              <View>
                <Text style={styles.menuLabel}>Lịch sử đơn dịch vụ</Text>
                <Text style={styles.menuSub}>Theo dõi tiến trình & hóa đơn</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/notifications' as any)}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🔔</Text>
              <View>
                <Text style={styles.menuLabel}>Thông báo của tôi</Text>
                <Text style={styles.menuSub}>Cập nhật đơn và khuyến mãi</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>
        </View>

        {/* SECTION 2: THANH TOÁN & ƯU ĐÃI */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Tài chính & Khuyến mãi</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('Phương thức thanh toán', 'Bạn đang liên kết Ví MoMo và Thẻ ATM nội địa Napas.')
            }>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>💳</Text>
              <View>
                <Text style={styles.menuLabel}>Phương thức thanh toán</Text>
                <Text style={styles.menuSub}>Ví MoMo, VNPAY, Thẻ liên kết</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/services')}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🎟️</Text>
              <View>
                <Text style={styles.menuLabel}>Kho voucher ưu đãi</Text>
                <Text style={styles.menuSub}>FLASH50K, SUMMER20 đang sẵn có</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>
        </View>

        {/* SECTION 3: HỖ TRỢ & ĐIỀU KHOẢN */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Hỗ trợ & Thông tin chính sách</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/ai')}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🤖</Text>
              <View>
                <Text style={styles.menuLabel}>Trợ lý AI HomeCare 24/7</Text>
                <Text style={styles.menuSub}>Giải đáp tức thì mọi thắc mắc</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Tổng đài hỗ trợ HomeCare',
                'Hotline miễn phí: 1900 6868 (8:00 - 21:00 hàng ngày)\nEmail: cskh@homecare.vn'
              )
            }>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>📞</Text>
              <View>
                <Text style={styles.menuLabel}>Trung tâm hỗ trợ khách hàng</Text>
                <Text style={styles.menuSub}>Hotline: 1900 6868 (8:00 - 21:00)</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Điều khoản sử dụng & Bảo mật',
                'Nền tảng HomeCare cam kết bảo mật 100% dữ liệu cá nhân khách hàng. Toàn bộ nhân viên cung cấp dịch vụ đều được xác minh danh tính và kiểm tra tư pháp.'
              )
            }>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>📄</Text>
              <View>
                <Text style={styles.menuLabel}>Điều khoản & Chính sách bảo mật</Text>
                <Text style={styles.menuSub}>Bảo hiểm hư hại, quyền riêng tư</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={BrandColors.gray400} />
          </Pressable>
        </View>

        {/* LOGOUT BUTTON */}
        <Pressable
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}>
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </Pressable>

        <Text style={styles.versionText}>HomeCare App v1.0.0 • Nền tảng Đa Dịch Vụ Gia Đình</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Logout confirmation modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản khách hàng không?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: 14,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: BrandColors.primary,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  userPhone: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  menuGroup: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.gray900,
  },
  menuSub: {
    fontSize: 11,
    color: BrandColors.gray400,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 13,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.danger,
  },
  versionText: {
    fontSize: 11,
    color: BrandColors.gray400,
    textAlign: 'center',
    marginTop: 10,
  },
});
