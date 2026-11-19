import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '@/components/common/AppBackground';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAppTheme } from '@/context/ThemeContext';
import type { StaffBankAccount } from '@/data/connectedStaffRepository';
import { StaffService } from '@/data/staffService';
import { BankLinkForm } from './BankLinkForm';

export function StaffBankAccountsModal({ staffId, accounts, onClose }: {
  staffId: string;
  accounts: StaffBankAccount[];
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [linking, setLinking] = useState(false);
  const [confirming, setConfirming] = useState<string>();
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    void StaffService.refreshWallet(controller.signal)
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được tài khoản liên kết.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loadAttempt]);

  const close = () => {
    if (lock.current) return;
    if (linking) setLinking(false);
    else onClose();
  };
  const apply = async (id: string, unlink: boolean) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (unlink) await StaffService.unlinkBank(staffId, id);
      else await StaffService.setDefaultBank(staffId, id);
      setConfirming(undefined);
      setNotice(unlink ? 'Đã bỏ liên kết tài khoản.' : 'Đã cập nhật tài khoản mặc định.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được tài khoản.');
    } finally { lock.current = false; setBusy(false); }
  };

  return <Modal visible animationType="slide" presentationStyle="fullScreen"
    statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
    <AppBackground gradient={colors.backgroundGradient}>
      {linking ? <BankLinkForm onClose={() => setLinking(false)} onSave={async (bin, account, holder) => {
        lock.current = true;
        try {
          const result = await StaffService.addBank(staffId, bin, account, holder);
          setNotice(result.status === 'VERIFIED' ? 'Đã liên kết và xác minh tài khoản.' : 'Đã lưu tài khoản, đang chờ xác minh.');
        } finally { lock.current = false; }
      }} /> : <SafeAreaView style={s.screen}>
        <View style={[s.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[s.title, { color: colors.text }]}>Quản lý ngân hàng</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng quản lý ngân hàng" disabled={busy} style={s.close} onPress={close}>
            <IconSymbol name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={s.list}>
          {loading && <ActivityIndicator accessibilityLabel="Đang tải tài khoản liên kết" color={colors.primary} />}
          {!!error && <View style={[s.feedback, { backgroundColor: colors.dangerBg }]}>
            <Text accessibilityRole="alert" style={{ color: colors.dangerText }}>{error}</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setConfirming(undefined); setLoadAttempt(value => value + 1); }}>
              <Text style={[s.actionText, { color: colors.dangerText }]}>Tải lại danh sách</Text>
            </Pressable>
          </View>}
          {!!notice && <Text accessibilityLiveRegion="polite" style={[s.feedback, { backgroundColor: colors.accentBg, color: colors.accentText }]}>{notice}</Text>}
          {!loading && !error && !accounts.length && <Text style={[s.feedback, { backgroundColor: colors.surface, color: colors.textSecondary }]}>Chưa liên kết tài khoản ngân hàng.</Text>}
          {accounts.map(bank => <View key={bank.id} style={[s.card, { backgroundColor: colors.surface, borderColor: bank.isDefault ? colors.accentBorder : colors.border }]}>
            <View style={s.row}>
              <View style={[s.iconBox, { backgroundColor: colors.accentBg }]}>
                <IconSymbol name="office" size={20} color={colors.accentText} />
              </View>
              <View style={s.bankInfo}>
                <Text style={[s.bankName, { color: colors.text }]}>{bank.bankName || 'Chưa xác định ngân hàng'} · •••• {bank.accountNumber.slice(-4)}</Text>
                <Text style={[s.meta, { color: colors.textSecondary }]}>{bank.accountHolder}</Text>
                <Text style={[s.meta, { color: bank.status === 'VERIFIED' ? colors.accentText : colors.warningText }]}>{bank.status === 'VERIFIED' ? 'Đã xác minh' : 'Chờ xác minh'}</Text>
              </View>
              {bank.isDefault && <Text style={[s.badge, { backgroundColor: colors.accentBg, color: colors.accentText }]}>Mặc định</Text>}
            </View>
            {confirming === bank.id && <Text style={{ color: colors.textSecondary }}>Bỏ liên kết tài khoản này?</Text>}
            <View style={s.actions}>
              {confirming === bank.id ? <>
                <Pressable accessibilityRole="button" disabled={busy} style={s.action} onPress={() => setConfirming(undefined)}>
                  <Text style={[s.actionText, { color: colors.textSecondary }]}>Giữ liên kết</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={busy} style={s.action} onPress={() => void apply(bank.id, true)}>
                  <Text style={[s.actionText, { color: colors.dangerText }]}>{busy ? 'Đang xử lý…' : 'Xác nhận bỏ liên kết'}</Text>
                </Pressable>
              </> : <>
                {bank.status === 'VERIFIED' && !bank.isDefault && <Pressable accessibilityRole="button" disabled={busy || loading} style={s.action} onPress={() => void apply(bank.id, false)}>
                  <Text style={[s.actionText, { color: colors.accentText }]}>Đặt mặc định</Text>
                </Pressable>}
                <Pressable accessibilityRole="button" disabled={busy || loading} style={s.action}
                  onPress={() => { setConfirming(bank.id); setError(''); setNotice(''); }}>
                  <Text style={[s.actionText, { color: colors.dangerText }]}>Bỏ liên kết</Text>
                </Pressable>
              </>}
            </View>
          </View>)}
        </ScrollView>
        <View style={[s.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" disabled={busy} style={[s.add, { backgroundColor: colors.primaryDark }]}
            onPress={() => { setError(''); setNotice(''); setConfirming(undefined); setLinking(true); }}>
            <IconSymbol name="plus" size={20} color="#fff" />
            <Text style={s.addText}>Liên kết thêm ngân hàng</Text>
          </Pressable>
        </View>
      </SafeAreaView>}
    </AppBackground>
  </Modal>;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 20, fontWeight: '800' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 12, padding: 16, width: '100%', maxWidth: 600, alignSelf: 'center' },
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  bankInfo: { flex: 1, gap: 3 },
  bankName: { fontSize: 14, fontWeight: '800' },
  meta: { fontSize: 12 },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  actionText: { fontSize: 13, fontWeight: '700' },
  feedback: { padding: 12, borderRadius: 12, gap: 6 },
  footer: { borderTopWidth: 1, padding: 14 },
  add: { alignSelf: 'center', width: '100%', maxWidth: 568, minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 12 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
