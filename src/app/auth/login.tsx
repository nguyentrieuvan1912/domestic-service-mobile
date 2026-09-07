import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/user';

export default function LoginScreen() {
  const router = useRouter();
  const { login, quickLoginAsCustomer, quickLoginAsStaff } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');
  const [account, setAccount] = useState('0901234001'); // Default demo account
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = () => {
    if (!account.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu.');
      return;
    }

    const success = login(account, selectedRole);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Đăng nhập không thành công',
        `Không tìm thấy tài khoản ${selectedRole === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên'} tương ứng. Vui lòng bấm vào nút đăng nhập nhanh bên dưới.`
      );
    }
  };

  const handleDemoCustomer = () => {
    quickLoginAsCustomer('cust-001');
    router.replace('/(tabs)');
  };

  const handleDemoStaff = () => {
    quickLoginAsStaff('staff-001');
    Alert.alert(
      'Đăng nhập Nhân viên',
      'Đã đăng nhập tài khoản Nhân viên Nguyễn Văn An. Bạn có thể kiểm tra danh sách việc làm và thu nhập tại trang cá nhân.',
      [{ text: 'Vào ứng dụng', onPress: () => router.replace('/(tabs)') }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Logo & Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoCircle}>
              <Text style={{ fontSize: 36 }}>🏡</Text>
            </View>
            <Text style={styles.brandName}>HomeCare</Text>
            <Text style={styles.brandSlogan}>Sạch nhà, nhẹ lo</Text>
          </View>

          {/* Role Selection Segmented Bar */}
          <View style={styles.roleSegment}>
            <Pressable
              style={[
                styles.roleTab,
                selectedRole === 'CUSTOMER' && styles.roleTabActive,
              ]}
              onPress={() => {
                setSelectedRole('CUSTOMER');
                setAccount('0901234001');
              }}>
              <Text
                style={[
                  styles.roleTabText,
                  selectedRole === 'CUSTOMER' && styles.roleTabTextActive,
                ]}>
                Khách hàng
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleTab,
                selectedRole === 'STAFF' && styles.roleTabActive,
              ]}
              onPress={() => {
                setSelectedRole('STAFF');
                setAccount('0912001001');
              }}>
              <Text
                style={[
                  styles.roleTabText,
                  selectedRole === 'STAFF' && styles.roleTabTextActive,
                ]}>
                Nhân viên đối tác
              </Text>
            </Pressable>
          </View>

          <Text style={styles.welcomeText}>
            Chào mừng {selectedRole === 'CUSTOMER' ? 'Khách hàng' : 'Đối tác'} trở lại!
          </Text>
          <Text style={styles.welcomeSub}>
            {selectedRole === 'CUSTOMER'
              ? 'Đăng nhập để đặt dịch vụ giúp việc nhanh chóng'
              : 'Đăng nhập để nhận đơn và theo dõi thu nhập hàng ngày'}
          </Text>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Số điện thoại hoặc Email</Text>
            <View style={styles.inputBox}>
              <IconSymbol name="user" size={16} color={BrandColors.gray400} />
              <TextInput
                value={account}
                onChangeText={setAccount}
                placeholder="Nhập số điện thoại hoặc email..."
                placeholderTextColor={BrandColors.gray400}
                style={styles.textInput}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputBox}>
              <IconSymbol name="shield" size={16} color={BrandColors.gray400} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={BrandColors.gray400}
                secureTextEntry={!showPassword}
                style={styles.textInput}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Text style={styles.showPassText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Remember me & Forgot pass */}
          <View style={styles.optionsRow}>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}>
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxActive,
                ]}>
                {rememberMe && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert('Quên mật khẩu', 'Mã OTP đặt lại mật khẩu sẽ gửi về số điện thoại của bạn.')
              }>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Pressable>
          </View>

          {/* Login Button */}
          <Pressable style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          </Pressable>

          {/* Quick Demo Login Helper Box */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Tài khoản Demo thử nghiệm nhanh:</Text>
            <View style={styles.demoButtonsRow}>
              <Pressable style={styles.demoBtn} onPress={handleDemoCustomer}>
                <Text style={styles.demoBtnText}>👤 Vào vai Khách hàng</Text>
              </Pressable>
              <Pressable
                style={[styles.demoBtn, styles.demoBtnStaff]}
                onPress={handleDemoStaff}>
                <Text style={[styles.demoBtnText, styles.demoBtnTextStaff]}>
                  👷 Vào vai Nhân viên
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  brandHeader: {
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: BrandColors.primaryDark,
  },
  brandSlogan: {
    fontSize: 13,
    color: BrandColors.gray500,
    marginTop: 2,
  },

  // Role Segment
  roleSegment: {
    flexDirection: 'row',
    backgroundColor: BrandColors.gray100,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginVertical: Spacing.two,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  roleTabActive: {
    backgroundColor: BrandColors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray500,
  },
  roleTabTextActive: {
    color: BrandColors.primary,
    fontWeight: '800',
  },

  welcomeText: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginTop: Spacing.two,
  },
  welcomeSub: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 4,
    marginBottom: Spacing.three,
  },
  formGroup: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.gray50,
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.two,
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.gray900,
  },
  showPassText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BrandColors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkIcon: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  rememberText: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  loginBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.four,
    elevation: 3,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginBtnText: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '800',
  },

  // Demo Fast Box
  demoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray500,
    marginBottom: Spacing.two,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: BrandColors.primaryLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  demoBtnStaff: {
    backgroundColor: '#EFF6FF',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  demoBtnTextStaff: {
    color: '#1D4ED8',
  },
});
