import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operationRequest } from '@/api/operations';

export type PayoutBank = { bin: string; name: string; shortName: string };
export function BankLinkModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (bin: string, account: string, holder: string) => Promise<void> }) {
  const [banks, setBanks] = useState<PayoutBank[]>([]), [bin, setBin] = useState('');
  const [account, setAccount] = useState(''), [holder, setHolder] = useState(''), [search, setSearch] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0), [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController(); setLoading(true); setError('');
    void operationRequest<PayoutBank[]>('finance', '/payout-banks', 'GET', undefined, controller.signal)
      .then(rows => { if (!controller.signal.aborted) setBanks(rows); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được ngân hàng.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [visible, revision]);
  const save = async () => {
    if (busy) return;
    if (!banks.some(bank => bank.bin === bin) || !/^\d{5,30}$/.test(account.trim()) || !holder.trim()) { setError('Chọn ngân hàng, nhập đúng số tài khoản và tên chủ tài khoản theo ngân hàng.'); return; }
    setBusy(true); setError('');
    try { await onSave(bin, account.trim(), holder.trim()); setBin(''); setAccount(''); setHolder(''); setSearch(''); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được tài khoản.'); }
    finally { setBusy(false); }
  };
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!busy) onClose(); }}>
    <SafeAreaView style={s.screen}><View style={s.header}><Text style={s.title}>Tài khoản nhận tiền</Text><Pressable disabled={busy} onPress={onClose} style={s.button}><Text style={s.green}>Đóng</Text></Pressable></View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <Text style={s.label}>1. Chọn ngân hàng được hỗ trợ</Text>
        <TextInput accessibilityLabel="Tìm ngân hàng" placeholder="Tìm tên hoặc mã ngân hàng" value={search} onChangeText={setSearch} style={s.input} />
        {loading ? <Text style={s.note}>Đang tải danh sách ngân hàng…</Text> : banks.length === 0 ? <Text style={s.note}>Chưa có ngân hàng nhận được cấu hình cho Kênh chi. Vui lòng chờ quản trị viên hoàn tất kết nối payOS.</Text> : <ScrollView nestedScrollEnabled style={s.list} keyboardShouldPersistTaps="handled">{banks.filter(bank => `${bank.shortName} ${bank.name} ${bank.bin}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))).map(bank => <Pressable key={bank.bin} disabled={busy} onPress={() => setBin(bank.bin)} style={[s.option, bank.bin === bin && s.selected]} accessibilityRole="radio" accessibilityState={{ checked: bank.bin === bin }}><Text style={s.label}>{bank.bin === bin ? '✓ ' : ''}{bank.shortName}</Text><Text style={s.note}>{bank.name}</Text></Pressable>)}</ScrollView>}
        <Pressable style={s.button} disabled={loading || busy} onPress={() => setRevision(v => v + 1)}><Text style={s.green}>Tải lại danh sách ngân hàng</Text></Pressable>
        <Text style={s.label}>2. Số tài khoản ngân hàng</Text><TextInput accessibilityLabel="Số tài khoản ngân hàng" keyboardType="number-pad" editable={!busy} maxLength={30} value={account} onChangeText={value => setAccount(value.replace(/\D/g, ''))} style={s.input} placeholder="Nhập số tài khoản nhận tiền" />
        <Text style={s.label}>3. Tên chủ tài khoản theo ngân hàng</Text><TextInput accessibilityLabel="Tên chủ tài khoản theo ngân hàng" editable={!busy} maxLength={160} autoCapitalize="characters" value={holder} onChangeText={setHolder} style={s.input} placeholder="Nhập đúng tên hiển thị tại ngân hàng" />
        <Text style={s.notice}>Tên này do bạn cung cấp, chưa được ngân hàng xác minh tự động. Admin sẽ đối chiếu số tài khoản và tên trước khi cho phép rút tiền.</Text>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        <Pressable accessibilityRole="button" disabled={busy || loading || !banks.some(bank => bank.bin === bin)} onPress={() => void save()} style={[s.submit, (busy || loading || !bin) && { opacity: 0.45 }]}><Text style={s.white}>{busy ? 'Đang lưu…' : 'Lưu và gửi xác minh'}</Text></Pressable>
      </ScrollView></KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F4F9F6' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff' }, title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#163A2C' }, content: { padding: 20, gap: 14, width: '100%', maxWidth: 540, alignSelf: 'center' }, label: { fontSize: 14, fontWeight: '700', color: '#163A2C' }, input: { borderWidth: 1, borderColor: '#B9D3C4', borderRadius: 12, backgroundColor: '#fff', color: '#163A2C', padding: 14, fontSize: 15 }, list: { maxHeight: 220, borderRadius: 12, borderWidth: 1, borderColor: '#D2E5D9', backgroundColor: '#fff' }, option: { padding: 14, gap: 5, borderBottomWidth: 1, borderBottomColor: '#E7F0EB' }, selected: { backgroundColor: '#DFF5E9' }, note: { color: '#64748B', fontSize: 12, lineHeight: 19 }, notice: { color: '#875B00', backgroundColor: '#FFF5D8', padding: 14, borderRadius: 12, lineHeight: 21 }, error: { color: '#B91C1C', lineHeight: 20 }, button: { padding: 12, minHeight: 44 }, green: { color: '#047857', fontWeight: '700' }, submit: { padding: 16, backgroundColor: '#047857', borderRadius: 12 }, white: { color: '#fff', fontWeight: '700', textAlign: 'center' } });
