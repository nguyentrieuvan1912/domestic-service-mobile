import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/common/IconSymbol';
import { KeyboardSafeLayout } from '@/components/common/KeyboardSafeLayout';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { currentUser, isLoading, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  if (isLoading) return null;
  if (currentUser?.role !== 'CUSTOMER' && currentUser?.role !== 'STAFF') return <Redirect href="/auth/login" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(currentUser.role === 'STAFF' ? '/staff/profile' : '/(tabs)/profile');
  };
  const submit = async () => {
    if (submitting.current || saved) return;
    if (!currentPassword.trim()) return setError('Vui lòng nhập mật khẩu hiện tại.');
    if (newPassword.length < 8 || !newPassword.trim()) return setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
    if (newPassword !== confirmPassword) return setError('Hai lần nhập mật khẩu mới không khớp.');
    if (currentPassword === newPassword) return setError('Mật khẩu mới phải khác mật khẩu hiện tại.');

    submitting.current = true;
    setSaving(true);
    setError('');
    Keyboard.dismiss();
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa đổi được mật khẩu. Vui lòng thử lại.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const fields = [
    { label: 'Mật khẩu hiện tại', value: currentPassword, setValue: setCurrentPassword, autoComplete: 'current-password' },
    { label: 'Mật khẩu mới', value: newPassword, setValue: setNewPassword, autoComplete: 'new-password' },
    { label: 'Nhập lại mật khẩu mới', value: confirmPassword, setValue: setConfirmPassword, autoComplete: 'new-password' },
  ] as const;

  return (
    <KeyboardSafeLayout>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={goBack} hitSlop={8}>
            <IconSymbol name="arrowBack" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Đổi mật khẩu</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {saved ? (
            <Text accessibilityLiveRegion="polite" style={[styles.label, { color: colors.accentText }]}>Đã đổi mật khẩu thành công.</Text>
          ) : fields.map(field => (
            <View key={field.label} style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{field.label}</Text>
              <TextInput
                accessibilityLabel={field.label}
                autoComplete={field.autoComplete}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!saving}
                maxLength={72}
                value={field.value}
                onChangeText={value => { field.setValue(value); setError(''); }}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            </View>
          ))}
          {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.dangerText }}>{error}</Text>}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={saved ? goBack : submit}
            style={[styles.button, { backgroundColor: colors.primaryDark, opacity: saving ? 0.65 : 1 }]}>
            <Text style={styles.buttonText}>{saved ? 'Xong' : saving ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardSafeLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: Spacing.four, gap: Spacing.four },
  field: { gap: Spacing.two },
  label: { fontSize: 15, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.three, fontSize: 16 },
  button: { minHeight: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
