import { useBottomTabSpacing } from '@/components/common/TabImageIcon';
import AvatarEditor from '@/components/common/AvatarEditor';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AppearanceModal } from '@/components/common/AppearanceModal';
import { LegalPolicyModal } from '@/components/common/LegalPolicyModal';
import { useAuth } from '@/context/AuthContext';
import { themeModeLabel, useAppTheme } from '@/context/ThemeContext';
import { Redirect, useFocusEffect } from 'expo-router';
import { operationRequest } from '@/api/operations';

export default function ProfileScreen() {
  const { height: bottomTabHeight } = useBottomTabSpacing();
  const router = useRouter();
  const { currentCustomer, accessToken, logout, isLoading, refreshProfile } = useAuth();
  const { colors, mode, preset } = useAppTheme();
  const [profileError, setProfileError] = useState('');
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [statistics, setStatistics] = useState<{ owner: string; count: number | null; error: string }>({ owner: '', count: null, error: '' });
  const [statisticsAttempt, setStatisticsAttempt] = useState(0);
  const statisticsOwner = currentCustomer && accessToken ? currentCustomer.id + ':' + accessToken : '';
  useFocusEffect(useCallback(() => {
    if (!currentCustomer || !accessToken) return;
    const owner = statisticsOwner;
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight || controller.signal.aborted || AppState.currentState === 'background') return;
      inFlight = true;
      try {
        const result = await operationRequest<{ completedBookings: number }>('booking', '/customer/statistics', 'GET', undefined, controller.signal);
        if (!Number.isSafeInteger(result.completedBookings) || result.completedBookings < 0) throw new Error('Số đơn hoàn tất trả về chưa hợp lệ.');
        if (!controller.signal.aborted) setStatistics({ owner, count: result.completedBookings, error: '' });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setStatistics(previous => previous.owner === owner && previous.count !== null
            ? previous
            : { owner, count: null, error: cause instanceof Error ? cause.message : 'Chưa tải được số đơn hoàn tất.' });
        }
      } finally { inFlight = false; }
    };
    void load();
    const timer = setInterval(() => { void load(); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [statisticsOwner, statisticsAttempt]));
  useFocusEffect(useCallback(() => {
    let active = true;
    void refreshProfile().then(() => { if (active) setProfileError(''); }).catch(error => { if (active) setProfileError(error.message); });
    return () => { active = false; };
  }, [refreshProfile]));
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    void logout().catch(() => Alert.alert('Đăng xuất', 'Đã thoát trên ứng dụng; chưa kết nối được backend để thu hồi phiên.'));
    setShowLogoutModal(false);
    router.replace('/auth/login');
  };

  if (isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Đang tải tài khoản...</Text></View>;
  if (!currentCustomer) return <Redirect href="/auth/login" />;

  return (
    <View style={styles.gradientContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tài khoản</Text>
        </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: styles.scrollContent.paddingBottom + bottomTabHeight }]}>

        {profileError ? <Text style={{ color: BrandColors.danger, marginBottom: 12 }}>{profileError}</Text> : null}
        {/* Customer Profile Card */}
        <Pressable
          style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/account/personal-info')}>
          <AvatarEditor style={styles.avatar} />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{currentCustomer?.fullName || 'Khách hàng'}</Text>
              <Badge label="Khách hàng" variant="primary" size="sm" />
            </View>
            <Text style={[styles.userPhone, { color: colors.textSecondary }]}>📱 {currentCustomer?.phone || 'Chưa đăng nhập'}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>✉️ {currentCustomer?.email || 'Chưa đăng nhập'}</Text>
          </View>
        </Pressable>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Pressable
            style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.statNum}>{statistics.owner === statisticsOwner ? statistics.count ?? (statistics.error ? '—' : '…') : '…'}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Đơn hoàn tất</Text>
          </Pressable>

          <Pressable
            style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/account/addresses')}>
            <Text style={styles.statNum}>{currentCustomer.savedAddressCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Địa chỉ lưu</Text>
          </Pressable>
        </View>

        {statistics.owner === statisticsOwner && !!statistics.error && (
          <Pressable accessibilityRole="button" onPress={() => setStatisticsAttempt(value => value + 1)} style={{ marginBottom: 12 }}>
            <Text style={{ color: BrandColors.danger }}>Chưa tải được số đơn hoàn tất. Chạm để thử lại.</Text>
          </Pressable>
        )}

        {/* SECTION 1: QUẢN LÝ DỊCH VỤ & TIỆN ÍCH */}
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Quản lý dịch vụ & cá nhân</Text>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => router.push('/account/addresses')}>
            <View style={styles.menuLeft}>
              <IconSymbol name="📍" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Sổ địa chỉ</Text>
                <Text numberOfLines={1} style={[styles.menuSub, { color: colors.textMuted }]}>
                  {currentCustomer.defaultAddressLabel || 'Thêm địa chỉ phục vụ'}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => router.push('/(tabs)/bookings')}>
            <View style={styles.menuLeft}>
              <IconSymbol name="📋" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Lịch sử đơn dịch vụ</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>Theo dõi tiến trình & hóa đơn</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => router.push('/notifications' as any)}>
            <View style={styles.menuLeft}>
              <IconSymbol name="🔔" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Thông báo của tôi</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>Cập nhật đơn và khuyến mãi</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            accessibilityRole="button"
            onPress={() => router.push('/account/change-password')}>
            <View style={styles.menuLeft}>
              <IconSymbol name="lock" size={20} color={colors.accentText} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Đổi mật khẩu</Text>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            accessibilityRole="button"
            onPress={() => setShowAppearanceModal(true)}>
            <View style={styles.menuLeft}>
              <IconSymbol name="sparkle" size={20} color={preset.swatch} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Giao diện & Màu nền</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                  {themeModeLabel(mode)} • {preset.label}
                </Text>
              </View>
            </View>
            <View style={styles.appearancePreviewRight}>
              <View style={[styles.appearanceSwatchDot, { backgroundColor: preset.swatch, borderColor: colors.border }]} />
              <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
            </View>
          </Pressable>
        </View>

        {/* SECTION 2: THANH TOÁN & ƯU ĐÃI */}
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Tài chính & Khuyến mãi</Text>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() =>
              router.push('/account/wallet')
            }>
            <View style={styles.menuLeft}>
              <IconSymbol name="💳" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Ví của tôi</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>Số dư, nạp tiền và lịch sử giao dịch</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/(tabs)/services')}>
            <View style={styles.menuLeft}>
              <IconSymbol name="🎟️" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Kho voucher ưu đãi</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>FLASH50K, SUMMER20 đang sẵn có</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* SECTION 3: HỖ TRỢ & ĐIỀU KHOẢN */}
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Hỗ trợ & Thông tin chính sách</Text>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => router.push('/ai')}>
            <View style={styles.menuLeft}>
              <IconSymbol name="🤖" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Trợ lý AI CleanMaster 24/7</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>Giải đáp tức thì mọi thắc mắc</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() =>
              Alert.alert(
                'Tổng đài hỗ trợ CleanMaster',
                'Hotline miễn phí: 1900 6868 (8:00 - 21:00 hàng ngày)\nEmail: cskh@homecare.vn'
              )
            }>
            <View style={styles.menuLeft}>
              <IconSymbol name="📞" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Trung tâm hỗ trợ khách hàng</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>Hotline: 1900 6868 (8:00 - 21:00)</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => setShowLegalModal(true)}>
            <View style={styles.menuLeft}>
              <IconSymbol name="📄" style={styles.menuIcon} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Điều khoản & Chính sách bảo mật</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>Bảo hiểm hư hại, quyền riêng tư</Text>
              </View>
            </View>
            <IconSymbol name="chevronRight" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* LOGOUT BUTTON */}
        <Pressable
          style={[styles.logoutBtn, { backgroundColor: colors.dangerBg }]}
          onPress={() => setShowLogoutModal(true)}>
          <Text style={[styles.logoutBtnText, { color: colors.dangerText }]}>Đăng xuất tài khoản</Text>
        </Pressable>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>CleanMaster v1.0.0 • Nền tảng Đa Dịch Vụ Gia Đình</Text>

      </ScrollView>

      {/* Appearance modal */}
        <AppearanceModal
          visible={showAppearanceModal}
          onClose={() => setShowAppearanceModal(false)}
        />

      {/* Legal & Privacy modal */}
        <LegalPolicyModal
          visible={showLegalModal}
          initialTab="terms"
          onClose={() => setShowLegalModal(false)}
        />

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
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 12,
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
  appearancePreviewRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appearanceSwatchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
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
