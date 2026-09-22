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

export default function RegisterScreen() {
  const router = useRouter();
  const { quickLoginAsCustomer } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = () => {
    setErrorMessage('');

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage('Số điện thoại không hợp lệ (tối thiểu 10 chữ số).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Email không đúng định dạng.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu không trùng khớp.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản sử dụng của CleanMaster.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Đăng ký thành công!',
        `Chào mừng ${fullName} đến với nền tảng CleanMaster. Bạn đã nhận được mã ưu đãi FLASH50K cho đơn dịch vụ đầu tiên.`,
        [
          {
            text: 'Bắt đầu sử dụng',
            onPress: () => {
              quickLoginAsCustomer('cust-001');
              router.replace('/(tabs)');
            },
          },
        ]
      );
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.topNav}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <IconSymbol name="back" size={20} color={BrandColors.gray800} />
          </Pressable>
          <Text style={styles.topNavTitle}>Tạo tài khoản</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng ký tài khoản Khách hàng</Text>
            <Text style={styles.formSubtitle}>
              Trải nghiệm đặt dịch vụ gia đình nhanh chóng, minh bạch và an tâm.
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <Text style={styles.fieldLabel}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setErrorMessage('');
              }}
              placeholder="Nguyễn Văn A"
            />

            {/* Phone */}
            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setErrorMessage('');
              }}
              placeholder="0901 234 567"
              keyboardType="phone-pad"
            />

            {/* Email */}
            <Text style={styles.fieldLabel}>Địa chỉ Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrorMessage('');
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text style={styles.fieldLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrorMessage('');
              }}
              placeholder="Tối thiểu 6 ký tự..."
              secureTextEntry
            />

            {/* Confirm Password */}
            <Text style={styles.fieldLabel}>Xác nhận mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrorMessage('');
              }}
              placeholder="Nhập lại mật khẩu..."
              secureTextEntry
            />

            {/* Terms & Conditions Checkbox */}
            <Pressable
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}>
              <Text style={{ fontSize: 18 }}>{agreeTerms ? '☑' : '☐'}</Text>
              <Text style={styles.termsText}>
                Tôi đồng ý với <Text style={styles.termsHighlight}>Điều khoản sử dụng</Text> và{' '}
                <Text style={styles.termsHighlight}>Chính sách bảo mật</Text> của CleanMaster
              </Text>
            </Pressable>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Tạo tài khoản</Text>
              )}
            </Pressable>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <Pressable onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
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
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: BrandColors.gray900,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: Spacing.three,
  },
  termsText: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 18,
    flex: 1,
  },
  termsHighlight: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  loginText: {
    fontSize: 13,
    color: BrandColors.gray600,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
});
