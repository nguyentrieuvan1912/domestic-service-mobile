import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Header } from '@/components/common/Header';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!fullName || !phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }
    Alert.alert(
      'Đăng ký thành công',
      'Chào mừng bạn đến với HomeCare! Bạn nhận được mã ưu đãi WELCOME10 giảm 10% cho đơn đầu tiên.',
      [{ text: 'Đăng nhập ngay', onPress: () => router.replace('/auth/login') }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Đăng ký tài khoản" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tạo tài khoản mới</Text>
        <Text style={styles.subtitle}>
          Trở thành thành viên của HomeCare để nhận nhiều ưu đãi độc quyền
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            placeholder="Ví dụ: Nguyễn Thị Hoa"
            placeholderTextColor={BrandColors.gray400}
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            placeholder="Ví dụ: 0901234567"
            placeholderTextColor={BrandColors.gray400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            placeholder="Ít nhất 6 ký tự..."
            placeholderTextColor={BrandColors.gray400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <Pressable style={styles.registerBtn} onPress={handleRegister}>
          <Text style={styles.registerBtnText}>Đăng ký thành viên</Text>
        </Pressable>

        <Pressable
          style={styles.loginLink}
          onPress={() => router.replace('/auth/login')}>
          <Text style={styles.loginLinkText}>
            Đã có tài khoản? <Text style={{ color: BrandColors.primary, fontWeight: '700' }}>Đăng nhập</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginTop: Spacing.two,
  },
  subtitle: {
    fontSize: 13,
    color: BrandColors.gray500,
    marginTop: 4,
    marginBottom: Spacing.four,
  },
  formGroup: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray700,
    marginBottom: 6,
  },
  input: {
    backgroundColor: BrandColors.gray50,
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    height: 48,
    fontSize: 14,
    color: BrandColors.gray900,
  },
  registerBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  registerBtnText: {
    color: BrandColors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  loginLinkText: {
    fontSize: 13,
    color: BrandColors.gray600,
  },
});
