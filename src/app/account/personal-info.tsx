import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { currentCustomer, updateCustomerProfile } = useAuth();
  const [fullName, setFullName] = useState(currentCustomer?.fullName || '');
  const [phone, setPhone] = useState(currentCustomer?.phone || '');
  const [email, setEmail] = useState(currentCustomer?.email || '');

  const handleSave = () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên, số điện thoại và email.');
      return;
    }

    updateCustomerProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatar: currentCustomer?.avatar || '',
    });
    Alert.alert('Đã lưu', 'Thông tin cá nhân của bạn đã được cập nhật.', [
      { text: 'Xong', onPress: () => router.back() },
    ]);
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <IconSymbol name="arrowBack" size={28} color={BrandColors.gray900} />
          </Pressable>
          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <Image
              source={{
                uri: currentCustomer?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              }}
              style={styles.avatar}
            />
            <Text style={styles.avatarHint}>Ảnh đại diện</Text>
            <Text style={styles.avatarSubHint}>Tính năng thay ảnh sẽ được bổ sung khi kết nối máy chủ.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

            <Text style={styles.fieldLabel}>Họ và tên</Text>
            <View style={styles.fieldRow}>
              <IconSymbol name="user" size={17} color={BrandColors.gray500} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={BrandColors.gray400}
                style={styles.input}
              />
            </View>

            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <View style={styles.fieldRow}>
              <IconSymbol name="phone" size={17} color={BrandColors.gray500} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={BrandColors.gray400}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldEmoji}>✉️</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Nhập email"
                placeholderTextColor={BrandColors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.note}>
            Thông tin này chỉ dùng để phục vụ đơn hàng và thông báo từ CleanMaster.
          </Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  backButton: { width: 32, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BrandColors.gray900 },
  headerSpacer: { width: 32 },
  content: { padding: Spacing.three, paddingBottom: 110 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.two },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: BrandColors.primary,
  },
  avatarHint: { marginTop: 10, fontSize: 14, fontWeight: '700', color: BrandColors.gray900 },
  avatarSubHint: { marginTop: 3, fontSize: 11, color: BrandColors.gray500, textAlign: 'center' },
  formCard: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: BrandColors.gray900, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: BrandColors.gray700, marginBottom: 7, marginTop: 12 },
  fieldRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    backgroundColor: BrandColors.gray50,
  },
  fieldEmoji: { fontSize: 15 },
  input: { flex: 1, color: BrandColors.gray900, fontSize: 14, paddingVertical: 10 },
  note: { fontSize: 11, color: BrandColors.gray500, lineHeight: 16, marginTop: Spacing.three, textAlign: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
  },
  saveButton: { backgroundColor: BrandColors.primary, borderRadius: BorderRadius.md, alignItems: 'center', paddingVertical: 14 },
  saveButtonText: { color: BrandColors.white, fontSize: 15, fontWeight: '800' },
});
