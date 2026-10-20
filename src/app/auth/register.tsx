import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { EmailChallenge, EmailVerified, IdentitySession, identityRequest } from '@/api/identity';

export default function RegisterScreen() {
  const router = useRouter();
  const { completeRegistration } = useAuth();
  const [step, setStep] = useState<'email' | 'code' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState<EmailChallenge | null>(null);
  const [verified, setVerified] = useState<EmailVerified | null>(null);
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const wait = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.resendAt) - now) / 1000)) : 0;
  const run = async (action: () => Promise<void>) => {
    if (isLoading) return;
    setIsLoading(true); setErrorMessage('');
    try { await action(); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'); }
    finally { setIsLoading(false); }
  };
  const send = async () => {
    const result = await identityRequest<EmailChallenge>('/auth/register/email', { email: email.trim() });
    setEmail(result.email); setChallenge(result); setCode(''); setVerified(null); setStep('code');
  };
  const next = () => { void run(async () => {
    if (step === 'email') {
      if (!/^[a-z0-9][a-z0-9.+_-]*@gmail\.com$/i.test(email.trim())) throw new Error('Vui lòng nhập Gmail hợp lệ (@gmail.com).');
      await send(); return;
    }
    if (step === 'code') {
      if (!/^[0-9]{6}$/.test(code)) throw new Error('Vui lòng nhập đủ 6 chữ số.');
      const result = await identityRequest<EmailVerified>('/auth/register/verify', { challengeId: challenge?.challengeId, code });
      setVerified(result); setStep('profile'); return;
    }
    if (!fullName.trim()) throw new Error('Vui lòng nhập họ và tên.');
    if (!/^(?:0[0-9]{9}|\+84[0-9]{9})$/.test(phone.trim())) throw new Error('Số điện thoại không hợp lệ.');
    if (password.length < 8) throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
    if (password !== confirmPassword) throw new Error('Xác nhận mật khẩu không khớp.');
    if (!agreeTerms) throw new Error('Vui lòng đồng ý với Điều khoản sử dụng.');
    const session = await identityRequest<IdentitySession>('/auth/register', { fullName: fullName.trim(), phone: phone.trim(), password, verificationToken: verified?.verificationToken });
    await completeRegistration(session); router.replace('/(tabs)');
  }); };
  const backToEmail = () => { setStep('email'); setChallenge(null); setVerified(null); setErrorMessage(''); setPassword(''); setConfirmPassword(''); };
  return <SafeAreaView style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <View style={styles.topNav}><Pressable style={styles.backBtn} onPress={() => { if (!isLoading) { if (step === 'email') router.back(); else backToEmail(); } }} hitSlop={8}><IconSymbol name="back" size={20} color={BrandColors.gray800} /></Pressable><Text style={styles.topNavTitle}>Tạo tài khoản</Text><View style={{ width: 36 }} /></View>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}><View style={styles.formCard}>
      <Text style={styles.formTitle}>Đăng ký tài khoản Khách hàng</Text>
      <Text style={styles.formSubtitle}>{step === 'email' ? 'Bước 1/3: Nhập Gmail của bạn để nhận mã xác thực.' : step === 'code' ? `Bước 2/3: Nhập mã 6 chữ số gửi đến ${challenge?.email}. Mã có hiệu lực 10 phút.` : `Bước 3/3: Gmail ${verified?.email} đã xác thực. Hoàn tất hồ sơ của bạn.`}</Text>
      {errorMessage ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text></View> : null}
      {step === 'email' && <><Text style={styles.fieldLabel}>Gmail</Text><TextInput accessibilityLabel="Gmail" style={styles.input} value={email} onChangeText={setEmail} placeholder="tenban@gmail.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={254} editable={!isLoading} /></>}
      {step === 'code' && <><Text style={styles.fieldLabel}>Mã xác thực</Text><TextInput accessibilityLabel="Mã xác thực" style={styles.input} value={code} onChangeText={value => setCode(value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} placeholder="6 chữ số" editable={!isLoading} />
        <Pressable disabled={isLoading || wait > 0} onPress={() => { void run(send); }}><Text style={[styles.loginLink, { marginTop: 14, opacity: wait > 0 ? 0.5 : 1 }]}>{wait > 0 ? `Gửi lại mã sau ${wait}s` : 'Gửi lại mã'}</Text></Pressable></>}
      {step === 'profile' && <><Text style={styles.fieldLabel}>Họ và tên</Text><TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nhập họ và tên" autoComplete="name" maxLength={160} editable={!isLoading} />
        <Text style={styles.fieldLabel}>Số điện thoại</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="0901234567" keyboardType="phone-pad" autoComplete="tel" maxLength={12} editable={!isLoading} />
        <Text style={styles.fieldLabel}>Mật khẩu</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Tối thiểu 8 ký tự" secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={72} editable={!isLoading} />
        <Text style={styles.fieldLabel}>Xác nhận mật khẩu</Text><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Nhập lại mật khẩu" secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={72} editable={!isLoading} />
        <Pressable style={styles.termsRow} disabled={isLoading} onPress={() => setAgreeTerms(!agreeTerms)}><Text style={{ fontSize: 18 }}>{agreeTerms ? '☑' : '☐'}</Text><Text style={styles.termsText}>Tôi đồng ý với <Text style={styles.termsHighlight}>Điều khoản sử dụng</Text> và <Text style={styles.termsHighlight}>Chính sách bảo mật</Text> của CleanMaster</Text></Pressable></>}
      <Pressable style={[styles.submitButton, isLoading && { opacity: 0.7 }]} onPress={next} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{step === 'email' ? 'Tiếp theo' : step === 'code' ? 'Xác thực' : 'Tạo tài khoản'}</Text>}</Pressable>
      {step !== 'email' && <Pressable disabled={isLoading} onPress={backToEmail}><Text style={[styles.loginLink, { marginTop: 14 }]}>Đổi Gmail / xác thực lại</Text></Pressable>}
      <View style={styles.loginRow}><Text style={styles.loginText}>Đã có tài khoản? </Text><Pressable disabled={isLoading} onPress={() => router.push('/auth/login')}><Text style={styles.loginLink}>Đăng nhập</Text></Pressable></View>
    </View></ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
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
