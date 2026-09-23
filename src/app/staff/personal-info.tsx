import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';

export default function StaffPersonalInfoScreen() {
  const router = useRouter();
  const { currentStaff, updateStaffProfile } = useAuth();
  const staff = currentStaff;
  const [phone, setPhone] = useState(staff?.phone || '0912 001 001');
  const [email, setEmail] = useState(staff?.email || 'hoa.nguyen.staff@cleanmaster.vn');
  const [bio, setBio] = useState(staff?.bio || 'Cẩn thận, chu đáo và trung thực.');

  const handleSave = () => {
    if (!phone.trim() || !email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại và email liên hệ.');
      return;
    }
    updateStaffProfile({ phone: phone.trim(), email: email.trim(), bio: bio.trim() });
    Alert.alert('Đã cập nhật', 'Thông tin liên hệ của bạn đã được lưu.', [{ text: 'Xong', onPress: () => router.back() }]);
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}><IconSymbol name="back" size={25} color={BrandColors.gray800} /></Pressable>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Image source={{ uri: staff?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' }} style={styles.avatar} />
          <Text style={styles.avatarName}>{staff?.fullName || 'Nguyễn Thị Hoa'}</Text>
          <Text style={styles.avatarHint}>Ảnh đại diện sẽ được cập nhật sau khi có kết nối máy chủ.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <Text style={styles.sectionHint}>Bạn có thể chủ động cập nhật các thông tin này.</Text>

          <Text style={styles.fieldLabel}>Số điện thoại</Text>
          <View style={styles.inputRow}><IconSymbol name="phone" size={17} color={BrandColors.gray500} /><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} placeholder="Nhập số điện thoại" /></View>

          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.inputRow}><Text style={styles.inputIcon}>✉️</Text><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} placeholder="Nhập email" /></View>

          <Text style={styles.fieldLabel}>Giới thiệu bản thân</Text>
          <TextInput value={bio} onChangeText={setBio} multiline textAlignVertical="top" style={[styles.inputRow, styles.bioInput]} placeholder="Giới thiệu ngắn về bạn" />
        </View>

        <View style={styles.card}>
          <View style={styles.lockedHeading}><IconSymbol name="shield" size={18} color="#047857" /><View><Text style={styles.sectionTitle}>Thông tin đã xác thực</Text><Text style={styles.sectionHint}>Chỉ CleanMaster có thể thay đổi sau khi xét duyệt.</Text></View></View>
          <ReadOnlyRow label="Họ và tên" value={staff?.fullName || 'Nguyễn Thị Hoa'} />
          <ReadOnlyRow label="Mã nhân viên" value={staff?.id ? `NV-${staff.id.replace('staff-', '').padStart(3, '0')}` : 'NV-001'} />
          <ReadOnlyRow label="CCCD" value={staff?.idCardNumber || '001089012345'} />
          <ReadOnlyRow label="Ngày sinh" value={staff?.dateOfBirth || '1989-06-12'} />
          <ReadOnlyRow label="Kinh nghiệm" value={`${staff?.experienceYears || 5} năm`} last />
        </View>

        <View style={styles.notice}><IconSymbol name="info" size={16} color="#0369A1" /><Text style={styles.noticeText}>Nếu cần chỉnh sửa thông tin đã xác thực, vui lòng liên hệ bộ phận vận hành CleanMaster để được hỗ trợ.</Text></View>
      </ScrollView>

      <View style={styles.bottomBar}><Pressable style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>Lưu thay đổi</Text></Pressable></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function ReadOnlyRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.readOnlyRow, last && styles.readOnlyRowLast]}><Text style={styles.readOnlyLabel}>{label}</Text><View style={styles.readOnlyValueWrap}><Text style={styles.readOnlyValue}>{value}</Text><IconSymbol name="lock" size={13} color={BrandColors.gray400} /></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' }, keyboard: { flex: 1 },
  header: { height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 17, fontWeight: '900', color: BrandColors.gray900 }, headerSpacer: { width: 36 },
  content: { padding: 16, gap: 14, paddingBottom: 105 },
  avatarSection: { alignItems: 'center', paddingTop: 4 }, avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#10B981' }, avatarName: { color: BrandColors.gray900, fontSize: 18, fontWeight: '900', marginTop: 9 }, avatarHint: { color: BrandColors.gray500, fontSize: 11, textAlign: 'center', marginTop: 3 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 15 }, sectionTitle: { color: BrandColors.gray900, fontSize: 14, fontWeight: '900' }, sectionHint: { color: BrandColors.gray500, fontSize: 11, lineHeight: 16, marginTop: 3 },
  fieldLabel: { color: BrandColors.gray700, fontSize: 12, fontWeight: '800', marginTop: 15, marginBottom: 7 }, inputRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: '#D8E3E8', backgroundColor: '#F8FAFC' }, inputIcon: { fontSize: 15 }, input: { flex: 1, color: BrandColors.gray900, fontSize: 14, paddingVertical: 10 }, bioInput: { minHeight: 90, alignItems: 'flex-start', paddingTop: 11, color: BrandColors.gray900, fontSize: 14, lineHeight: 20 },
  lockedHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 }, readOnlyRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }, readOnlyRowLast: { paddingBottom: 0 }, readOnlyLabel: { color: BrandColors.gray500, fontSize: 11, marginBottom: 3 }, readOnlyValueWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, readOnlyValue: { color: BrandColors.gray800, fontSize: 13, fontWeight: '800' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 13, padding: 12 }, noticeText: { flex: 1, color: '#075985', fontSize: 11, lineHeight: 16 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: '#E2E8F0' }, saveButton: { backgroundColor: '#047857', borderRadius: 13, paddingVertical: 14, alignItems: 'center' }, saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
