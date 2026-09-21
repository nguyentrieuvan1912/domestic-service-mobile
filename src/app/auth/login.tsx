import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, quickLoginAsCustomer } = useAuth();

  const [account, setAccount] = useState('0901234001'); // Default demo account
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    setErrorMessage('');
    if (!account.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const success = login(account.trim(), 'CUSTOMER');
      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Số điện thoại hoặc mật khẩu không chính xác. Thử lại hoặc dùng tài khoản Demo bên dưới.');
      }
    }, 600);
  };

  const handleDemoCustomer = () => {
    quickLoginAsCustomer('cust-001');
    router.replace('/(tabs)');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Quên mật khẩu',
      'Mã OTP khôi phục mật khẩu đã được gửi đến số điện thoại đăng ký của bạn. Vui lòng kiểm tra tin nhắn SMS.',
      [{ text: 'Đã hiểu' }]
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
              <Text style={{ fontSize: 38 }}>🏡</Text>
            </View>
            <Text style={styles.brandName}>HomeCare</Text>
            <Text style={styles.brandSlogan}>Nền tảng đa dịch vụ gia đình tận tâm</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng nhập Khách hàng</Text>
            <Text style={styles.formSubtitle}>
              Nhập số điện thoại hoặc email để quản lý đơn dịch vụ của bạn
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* Phone/Email Field */}
            <Text style={styles.inputLabel}>Số điện thoại hoặc Email</Text>
            <View style={styles.inputWrapper}>
              <IconSymbol name="phone" size={18} color={BrandColors.gray400} />
              <TextInput
                style={styles.input}
                value={account}
                onChangeText={(text) => {
                  setAccount(text);
                  setErrorMessage('');
                }}
                placeholder="0901 234 567"
                placeholderTextColor={BrandColors.gray400}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.three }]}>
              Mật khẩu
            </Text>
            <View style={styles.inputWrapper}>
              <IconSymbol name="lock" size={18} color={BrandColors.gray400} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                }}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={BrandColors.gray400}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}>
                <IconSymbol
                  name={showPassword ? 'eye' : 'eyeOff'}
                  size={18}
                  color={BrandColors.gray400}
                />
              </Pressable>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rowOptions}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}>
                <Text style={{ fontSize: 16 }}>{rememberMe ? '☑' : '☐'}</Text>
                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
              </Pressable>

              <Pressable onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Đăng nhập</Text>
              )}
            </Pressable>

            {/* Quick Demo Customer Button */}
            <Pressable
              style={styles.demoButton}
              onPress={handleDemoCustomer}>
              <Text style={styles.demoButtonText}>
                ⚡ Đăng nhập nhanh tài khoản mẫu (Demo)
              </Text>
            </Pressable>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <Pressable onPress={() => router.push('/auth/register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  brandSlogan: {
    fontSize: 13,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: BrandColors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: Spacing.three,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.gray900,
  },
  rowOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  submitButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  demoButton: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  demoButtonText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  registerText: {
    fontSize: 13,
    color: BrandColors.gray600,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
});
