import { IconSymbol } from '@/components/common/IconSymbol';
import { BorderRadius, BrandColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginRole = 'CUSTOMER' | 'STAFF';

const ROLE_CONTENT: Record<LoginRole, { title: string; description: string; demo: string; account: string; icon: string }> = {
  CUSTOMER: { title: 'Khách hàng', description: 'Đặt dịch vụ, theo dõi đơn và quản lý ngôi nhà của bạn.', demo: 'Trải nghiệm tài khoản khách hàng mẫu', account: '0901234001', icon: '🏠' },
  STAFF: { title: 'Nhân viên', description: 'Nhận ca phù hợp, quản lý lịch làm và theo dõi thu nhập.', demo: 'Trải nghiệm tài khoản nhân viên mẫu', account: '0912001001', icon: '🧹' },
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, quickLoginAsCustomer, quickLoginAsStaff } = useAuth();
  const [role, setRole] = useState<LoginRole>('CUSTOMER');
  const [account, setAccount] = useState(ROLE_CONTENT.CUSTOMER.account);
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const content = ROLE_CONTENT[role];

  const selectRole = (nextRole: LoginRole) => {
    setRole(nextRole);
    setAccount(ROLE_CONTENT[nextRole].account);
    setPassword('123456');
    setErrorMessage('');
  };

  const goToRoleFlow = () => {
    if (role === 'STAFF') router.replace('/staff' as never);
    else router.replace('/(tabs)');
  };

  const handleLogin = () => {
    setErrorMessage('');
    if (!account.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (login(account.trim(), role)) goToRoleFlow();
      else setErrorMessage(`Tài khoản này không thuộc nhóm ${content.title.toLowerCase()}. Hãy chọn đúng vai trò hoặc dùng tài khoản mẫu.`);
    }, 450);
  };

  const handleDemo = () => {
    if (role === 'STAFF') quickLoginAsStaff('staff-001');
    else quickLoginAsCustomer('cust-001');
    goToRoleFlow();
  };

  return (
    <LinearGradient colors={['#ECFDF5', '#F8FAFC', '#FFFFFF']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.brandHeader}>
              <View style={styles.logoCircle}><Text style={styles.logoText}>✦</Text></View>
              <Text style={styles.brandName}>CleanMaster</Text>
              <Text style={styles.brandSlogan}>Dịch vụ gia đình tin cậy, chuyên nghiệp</Text>
            </View>

            <View style={styles.roleSwitch}>
              {(Object.keys(ROLE_CONTENT) as LoginRole[]).map((item) => {
                const selected = role === item;
                return <Pressable key={item} onPress={() => selectRole(item)} style={[styles.roleOption, selected && styles.roleOptionActive]}>
                  <Text style={styles.roleEmoji}>{ROLE_CONTENT[item].icon}</Text>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTitle, selected && styles.roleTitleActive]}>{ROLE_CONTENT[item].title}</Text>
                    <Text style={[styles.roleHint, selected && styles.roleHintActive]}>{item === 'CUSTOMER' ? 'Đặt dịch vụ' : 'Nhận và làm ca'}</Text>
                  </View>
                  {selected && <View style={styles.roleCheck}><Text style={styles.roleCheckText}>✓</Text></View>}
                </Pressable>;
              })}
            </View>

            <View style={styles.formCard}>
              <View style={styles.formHeading}>
                <View style={styles.formIcon}><Text>{content.icon}</Text></View>
                <View style={styles.formHeadingCopy}>
                  <Text style={styles.formTitle}>Đăng nhập {content.title}</Text>
                  <Text style={styles.formSubtitle}>{content.description}</Text>
                </View>
              </View>

              {errorMessage ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMessage}</Text></View> : null}

              <Text style={styles.inputLabel}>Số điện thoại hoặc email</Text>
              <View style={styles.inputWrapper}>
                <IconSymbol name="phone" size={18} color={BrandColors.gray400} />
                <TextInput style={styles.input} value={account} onChangeText={(value) => { setAccount(value); setErrorMessage(''); }} placeholder={role === 'STAFF' ? '0912 001 001' : '0901 234 001'} placeholderTextColor={BrandColors.gray400} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <Text style={[styles.inputLabel, styles.passwordLabel]}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <IconSymbol name="lock" size={18} color={BrandColors.gray400} />
                <TextInput style={styles.input} value={password} onChangeText={(value) => { setPassword(value); setErrorMessage(''); }} placeholder="Nhập mật khẩu" placeholderTextColor={BrandColors.gray400} secureTextEntry={!showPassword} />
                <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={8}><Text style={styles.showPassword}>{showPassword ? 'Ẩn' : 'Hiện'}</Text></Pressable>
              </View>

              <View style={styles.optionsRow}>
                <Pressable style={styles.rememberRow} onPress={() => setRememberMe((current) => !current)}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>{rememberMe && <Text style={styles.checkboxText}>✓</Text>}</View>
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </Pressable>
                <Pressable onPress={() => Alert.alert('Quên mật khẩu', 'Tính năng khôi phục mật khẩu sẽ gửi mã xác thực tới thông tin tài khoản đã đăng ký.')}><Text style={styles.forgotText}>Quên mật khẩu?</Text></Pressable>
              </View>

              <Pressable style={[styles.submitButton, isLoading && styles.buttonLoading]} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.submitButtonText}>Đăng nhập {content.title}</Text><Text style={styles.submitArrow}>›</Text></>}
              </Pressable>

              <Pressable style={styles.demoButton} onPress={handleDemo}>
                <Text style={styles.demoSparkle}>✦</Text><Text style={styles.demoButtonText}>{content.demo}</Text>
              </Pressable>

              {role === 'CUSTOMER' ? <View style={styles.registerRow}>
                <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                <Pressable onPress={() => router.push('/auth/register')}><Text style={styles.registerLink}>Đăng ký ngay</Text></Pressable>
              </View> : <View style={styles.staffNotice}>
                <IconSymbol name="shield" size={16} color="#0369A1" />
                <Text style={styles.staffNoticeText}>Tài khoản nhân viên do công ty tạo và cấp sau khi hồ sơ được xét duyệt.</Text>
              </View>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 }, safeArea: { flex: 1 }, keyboardView: { flex: 1 }, content: { flexGrow: 1, padding: Spacing.four, paddingVertical: 28 },
  brandHeader: { alignItems: 'center', marginBottom: 22 }, logoCircle: { width: 66, height: 66, borderRadius: 23, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: BrandColors.primary, shadowOpacity: 0.25, shadowRadius: 14, elevation: 5 }, logoText: { color: '#FFFFFF', fontSize: 32 }, brandName: { color: BrandColors.gray900, fontSize: 27, fontWeight: '900', marginTop: 10 }, brandSlogan: { color: BrandColors.gray600, fontSize: 13, marginTop: 3 },
  roleSwitch: { flexDirection: 'row', gap: 10, marginBottom: 14 }, roleOption: { flex: 1, minHeight: 82, borderWidth: 1, borderColor: '#DCE5E8', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: BorderRadius.lg, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 7 }, roleOptionActive: { borderColor: BrandColors.primary, backgroundColor: '#F0FDFA', shadowColor: BrandColors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }, roleEmoji: { fontSize: 22 }, roleCopy: { flex: 1 }, roleTitle: { fontSize: 13, fontWeight: '800', color: BrandColors.gray700 }, roleTitleActive: { color: '#047857' }, roleHint: { fontSize: 10, color: BrandColors.gray500, marginTop: 3, lineHeight: 13 }, roleHintActive: { color: '#059669' }, roleCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center' }, roleCheckText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 }, formHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }, formIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }, formHeadingCopy: { flex: 1 }, formTitle: { color: BrandColors.gray900, fontSize: 18, fontWeight: '900' }, formSubtitle: { color: BrandColors.gray600, fontSize: 12, lineHeight: 17, marginTop: 2 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 14 }, errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 17 }, inputLabel: { color: BrandColors.gray700, fontSize: 12, fontWeight: '800', marginBottom: 7 }, passwordLabel: { marginTop: 14 }, inputWrapper: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: '#D7E0E8', backgroundColor: '#F8FAFC', borderRadius: 13, paddingHorizontal: 12 }, input: { flex: 1, color: BrandColors.gray900, fontSize: 14 }, showPassword: { color: BrandColors.primary, fontSize: 12, fontWeight: '800' },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 18 }, rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center' }, checkboxActive: { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary }, checkboxText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, rememberText: { color: BrandColors.gray600, fontSize: 11 }, forgotText: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
  submitButton: { minHeight: 52, borderRadius: 14, backgroundColor: BrandColors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: BrandColors.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 }, buttonLoading: { opacity: 0.75 }, submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, submitArrow: { color: '#FFFFFF', fontSize: 27, lineHeight: 28 }, demoButton: { minHeight: 44, marginTop: 11, borderRadius: 13, borderWidth: 1, borderColor: '#99F6E4', backgroundColor: '#F0FDFA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, demoSparkle: { color: '#0F766E', fontSize: 15 }, demoButtonText: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 17 }, registerText: { color: BrandColors.gray600, fontSize: 12 }, registerLink: { color: BrandColors.primary, fontSize: 12, fontWeight: '900' }, staffNotice: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: 15, padding: 10, borderRadius: 10, backgroundColor: '#F0F9FF' }, staffNoticeText: { flex: 1, color: '#075985', fontSize: 11, lineHeight: 16 },
});
