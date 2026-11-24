import AvatarEditor from '@/components/common/AvatarEditor';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { KeyboardSafeLayout } from '@/components/common/KeyboardSafeLayout';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { currentCustomer, updateCustomerProfile } = useAuth();
  const [fullName, setFullName] = useState(currentCustomer?.fullName || '');
  const [phone, setPhone] = useState(currentCustomer?.phone || '');
  const email = currentCustomer?.email || '';
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên, số điện thoại và email.');
      return;
    }

    setSaving(true);
    try { await updateCustomerProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatar: currentCustomer?.avatar || '',
    });
    Alert.alert('Đã lưu', 'Thông tin cá nhân của bạn đã được cập nhật.', [
      { text: 'Xong', onPress: () => router.back() },
    ]);
    } catch (error) { Alert.alert('Chưa lưu được', error instanceof Error ? error.message : 'Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardSafeLayout>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <IconSymbol name="arrowBack" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Thông tin cá nhân</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <AvatarEditor style={styles.avatar} disabled={saving} />
            <Text style={[styles.avatarHint, { color: colors.text }]}>Ảnh đại diện</Text>
            <Text style={[styles.avatarSubHint, { color: colors.textSecondary }]}>Bấm vào ảnh để chọn ảnh mới hoặc dùng ảnh mặc định.</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin liên hệ</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Họ và tên</Text>
            <View style={[styles.fieldRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <IconSymbol name="user" size={17} color={colors.textMuted} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Số điện thoại</Text>
            <View style={[styles.fieldRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <IconSymbol name="phone" size={17} color={colors.textMuted} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.fieldRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <IconSymbol name="✉️" style={styles.fieldEmoji} />
              <TextInput
                value={email}
                editable={false}
                placeholder="Gmail đã xác thực"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: colors.textSecondary }]}
              />
            </View>
          </View>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Thông tin này chỉ dùng để phục vụ đơn hàng và thông báo từ CleanMaster.
          </Text>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable style={styles.saveButton} disabled={saving} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardSafeLayout>
  );
}

const styles = StyleSheet.create({
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
  content: { padding: Spacing.three },
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
