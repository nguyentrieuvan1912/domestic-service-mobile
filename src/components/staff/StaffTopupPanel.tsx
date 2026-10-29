import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operationRequest, operationSession } from '@/api/operations';
import { PaymentQr } from './PaymentQr';

type Capabilities = { topupEnabled: boolean; message: string; minimumTopup: number; maximumTopup: number };
type Topup = { id: number; amount: number; status: string; requestKey: string; qrCode: string | null; accountNumber: string | null; accountName: string | null; bankBin: string | null; description: string; amountReceived: number; createdAt: string; expiresAt: string };
const labels: Record<string, string> = { CREATING: 'Đang tạo / cần khôi phục', PENDING: 'Chờ chuyển khoản', PAID: 'Đã nhận tiền', CANCELLED: 'Đã hủy liên kết', EXPIRED: 'Hết hạn liên kết', REVIEW: 'Cần đối soát số tiền' };
const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export function StaffTopupPanel({ visible, onClose, onCredited }: { visible: boolean; onClose: () => void; onCredited: () => void }) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [items, setItems] = useState<Topup[]>([]);
  const [amount, setAmount] = useState('10000');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Topup | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const close = () => { setSelected(null); onClose(); };
  const [now, setNow] = useState(Date.now());
  const { width } = useWindowDimensions();
  const loadSequence = useRef(0);
  const locked = useRef(false), request = useRef({ key: 'topup-' + Date.now() + '-' + Math.random().toString(36).slice(2), amount: 10000 });
  const owner = useRef(operationSession()?.token);
  const paidIds = useRef(new Set<number>());
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const current = () => mounted.current && owner.current === operationSession()?.token;
  const load = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++loadSequence.current;
    const [cap, topups] = await Promise.all([
      operationRequest<Capabilities>('finance', '/payment-capabilities', 'GET', undefined, signal),
      operationRequest<Topup[]>('finance', '/staff/me/topups', 'GET', undefined, signal),
    ]);
    if (!current() || signal?.aborted || sequence !== loadSequence.current) return;
    setCapabilities(cap); setItems(topups); setError('');
    setSelected(old => old ? topups.find(item => item.id === old.id) || old : null);
    const newlyPaid = topups.some(item => item.status === 'PAID' && !paidIds.current.has(item.id));
    topups.filter(item => item.status === 'PAID').forEach(item => paidIds.current.add(item.id));
    if (newlyPaid) onCredited();
  }, [onCredited]);
  useEffect(() => {
    if (!visible || !selected) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [selected?.id, visible]);
  useFocusEffect(useCallback(() => {
    if (!visible) return;
    const controller = new AbortController();
    const refresh = () => { if (AppState.currentState === 'active') void load(controller.signal).catch(cause => { if (current() && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được yêu cầu nạp.'); }); };
    refresh();
    const timer = setInterval(refresh, 10000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [load, visible]));

  const execute = async (work: () => Promise<unknown>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await work(); if (current()) await load(); }
    catch (cause) { if (current()) { const message = cause instanceof Error ? cause.message : 'Chưa xử lý được.'; await load().catch(() => {}); if (current()) setError(message); } }
    finally { locked.current = false; if (current()) setBusy(false); }
  };
  const create = (previous?: Topup) => {
    const value = previous?.amount ?? Number(amount);
    const minimum = capabilities?.minimumTopup ?? 2000, maximum = capabilities?.maximumTopup ?? 1000000;
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) { setError(`Nhập số tiền từ ${money(minimum)} đến ${money(maximum)}.`); return; }
    if (!previous && (request.current.amount !== value || items.some(item => item.requestKey === request.current.key && ['PAID', 'CANCELLED', 'EXPIRED'].includes(item.status)))) request.current = { key: 'topup-' + Date.now() + '-' + Math.random().toString(36).slice(2), amount: value };
    void execute(async () => {
      const item = await operationRequest<Topup>('finance', '/staff/me/topups', 'POST', { amount: value, requestKey: previous?.requestKey ?? request.current.key });
      if (current()) { setItems(old => [item, ...old.filter(i => i.id !== item.id)]); setSelected(item); }
    });
  };
  const check = (item: Topup) => void execute(async () => {
    const updated = await operationRequest<Topup>('finance', '/staff/me/topups/' + item.id + '/refresh', 'POST');
    if (current()) {
      setItems(old => old.map(row => row.id === updated.id ? updated : row));
      setSelected(old => old?.id === updated.id ? updated : old);
    }
  });
  const seconds = selected ? Math.max(0, Math.ceil((Date.parse(selected.expiresAt) - now) / 1000)) : 0;
  const payable = selected?.status === 'PENDING' && seconds > 0 && !!selected.qrCode;
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        {selected && <Pressable accessibilityRole="button" accessibilityLabel="Quay lại nhập số tiền nạp" onPress={() => setSelected(null)} style={s.back}><Text style={s.link}>‹</Text></Pressable>}
        <Text style={s.heading}>{selected ? 'Chi tiết giao dịch nạp' : 'Nạp tiền vào ví'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng màn hình nạp tiền" onPress={close} style={s.close}><Text style={s.link}>Đóng</Text></Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {!selected && <View style={s.card}>

    {!capabilities?.topupEnabled && <Text style={s.note}>{capabilities?.message || 'Đang kiểm tra kết nối thanh toán…'}</Text>}
    <Text style={s.note}>Chọn số tiền cần nạp. Ví được cập nhật sau khi xác minh chuyển khoản; tiền nạp không tính vào thu nhập ca làm.</Text>
    <TextInput accessibilityLabel="Số tiền nạp" keyboardType="number-pad" value={amount} editable={!busy} onChangeText={value => setAmount(value.replace(/\D/g, ''))} style={s.input} />
    <View style={s.wrap}>{[10000, 50000, 100000].map(value => <Pressable key={value} disabled={busy} onPress={() => setAmount(String(value))} style={s.chip}><Text style={s.link}>{money(value)}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" disabled={busy || !capabilities?.topupEnabled} onPress={() => create()} style={[s.button, (!capabilities?.topupEnabled || busy) && s.disabled]}><Text style={s.white}>{busy ? 'Đang xử lý…' : 'Nạp tiền · Hiện mã QR'}</Text></Pressable>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable disabled={busy} onPress={() => void execute(async () => {})} style={s.chip}><Text style={s.link}>Tải lại trạng thái</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHistory }} onPress={() => setShowHistory(value => !value)} style={s.historyToggle}><View style={{ flex: 1 }}><Text style={s.link}>Lịch sử nạp tiền ({items.length})</Text>{items.some(item => ['CREATING', 'PENDING', 'REVIEW'].includes(item.status)) && <Text style={s.historyHint}>Có giao dịch đang chờ xử lý</Text>}</View><Text style={s.link}>{showHistory ? 'Thu gọn' : 'Xem'}</Text></Pressable>
    {showHistory && !items.length && <Text style={s.note}>Chưa có yêu cầu nạp tiền.</Text>}
    {showHistory && items.slice(0, 10).map(item => <View key={item.id} style={s.record}>
      <Text style={s.title}>{money(item.amount)} · #{item.id}</Text>
      <Text style={item.status === 'PAID' ? s.link : s.note}>{labels[item.status] || item.status}</Text>
      <Text style={s.note}>{new Date(item.createdAt).toLocaleString('vi-VN')} · Đã nhận: {money(item.amountReceived)}</Text>
      {!['PAID', 'CANCELLED', 'EXPIRED'].includes(item.status) && <>
        {item.status === 'CREATING' && <Pressable disabled={busy} style={s.chip} onPress={() => create(item)}><Text style={s.link}>Khôi phục cùng mã yêu cầu</Text></Pressable>}
        <Pressable accessibilityRole="button" disabled={busy} style={s.button} onPress={() => { setNow(Date.now()); setSelected(item); check(item); }}><Text style={s.white}>Xem giao dịch trong app</Text></Pressable>
        <Pressable disabled={busy} style={s.chip} onPress={() => check(item)}><Text style={s.link}>Kiểm tra giao dịch với payOS</Text></Pressable>
      </>}
    </View>)}
        </View>}
          {selected && <>
            <View style={s.summary}><Text style={s.note}>Số tiền nạp · #{selected.id}</Text><Text style={s.amount}>{money(selected.amount)}</Text>
              <View style={[s.badge, selected.status === 'PAID' ? s.success : s.waiting]}><Text style={s.status}>{selected.status === 'PENDING' && !seconds ? 'Hết thời gian chuyển khoản' : labels[selected.status] || selected.status}</Text></View>
            </View>
            {payable && <View style={s.qrCard}>
              <PaymentQr value={selected.qrCode!} size={Math.max(120, Math.min(280, width - 72))} />
              <Text style={s.countdown}>Mã còn hiệu lực {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</Text>
              <Text style={s.centerNote}>Quét bằng ứng dụng ngân hàng trên máy khác, hoặc chụp màn hình rồi chọn ảnh QR trong ứng dụng ngân hàng của bạn.</Text>
            </View>}
            {selected.status === 'PAID' ? <View style={s.notice}><Text style={s.title}>Đã xác minh nhận đủ {money(selected.amount)}</Text><Text style={s.note}>Số tiền đã được cộng vào ví. Bạn có thể đóng màn hình để xem số dư mới.</Text></View>
              : !payable && <View style={s.notice}><Text style={s.title}>{selected.status === 'REVIEW' ? 'Giao dịch cần đối soát' : selected.status === 'CREATING' ? 'Yêu cầu đang được khôi phục' : seconds === 0 || selected.status === 'EXPIRED' ? 'Mã QR đã hết hạn' : selected.status === 'CANCELLED' ? 'Yêu cầu đã hủy' : 'Chưa tải được mã QR'}</Text><Text style={s.note}>Không chuyển thêm tiền vào yêu cầu này. Nếu đã chuyển, nhấn kiểm tra giao dịch để hệ thống đối soát.</Text></View>}
            {payable && <View style={s.details}>
              <Text style={s.title}>Thông tin chuyển khoản</Text>
              {[['Tên tài khoản', selected.accountName], ['Số tài khoản nhận', selected.accountNumber], ['Mã ngân hàng (BIN)', selected.bankBin], ['Số tiền', money(selected.amount)], ['Nội dung', selected.description]].map(([label, value]) => <View key={label} style={s.detailRow}><Text style={s.note}>{label}</Text><Text selectable style={s.detailValue}>{value || 'Chưa có thông tin'}</Text></View>)}
              <Text style={s.note}>Nhấn giữ thông tin để sao chép. Dùng đúng số tài khoản và nội dung của yêu cầu này.</Text>
              <Pressable accessibilityRole="button" style={s.chip} onPress={() => void Share.share({ message: `Nạp tiền CleanMaster #${selected.id}\nTên tài khoản: ${selected.accountName}\nSố tài khoản: ${selected.accountNumber}\nNgân hàng (BIN): ${selected.bankBin}\nSố tiền: ${money(selected.amount)}\nNội dung: ${selected.description}\nHạn chuyển: ${new Date(selected.expiresAt).toLocaleString('vi-VN')}` }).catch(() => setError('Chưa chia sẻ được thông tin chuyển khoản.'))}><Text style={s.link}>Chia sẻ thông tin chuyển khoản</Text></Pressable>
            </View>}
            {selected.status !== 'PAID' && <>
              <Text style={s.centerNote}>Đã nhận: {money(selected.amountReceived)}. Trạng thái tự cập nhật khi màn hình đang mở; backend xác minh với payOS khoảng 30 giây một lần.</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => check(selected)} style={[s.button, busy && s.disabled]}><Text style={s.white}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra giao dịch ngay'}</Text></Pressable>
            </>}
            {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
            <Text style={s.centerNote}>Đóng màn hình vẫn giữ yêu cầu nạp trong lịch sử. Việc đóng màn hình không xác nhận thanh toán hoặc hủy giao dịch.</Text>
          </>}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const s = StyleSheet.create({
  historyToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  historyHint: { color: '#64748B', fontSize: 12, marginTop: 4 },
  back: { padding: 10 },
  card: { padding: 16, borderRadius: 18, backgroundColor: '#fff', gap: 12, marginBottom: 16, borderWidth: 1, borderColor: '#DCE8E2' },
  title: { color: '#163A2C', fontWeight: '700', fontSize: 15 }, note: { color: '#64748B', fontSize: 12, lineHeight: 19 },
  input: { borderWidth: 1, borderColor: '#B4CDBF', padding: 13, borderRadius: 12, fontSize: 18, color: '#163A2C' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { padding: 12, borderRadius: 10, backgroundColor: '#EFF8F3', maxWidth: '100%' },
  link: { fontWeight: '700', fontSize: 13, color: '#00875F' }, button: { backgroundColor: '#00875F', padding: 14, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
  white: { textAlign: 'center', color: '#fff', fontWeight: '700' }, disabled: { opacity: 0.45 }, error: { color: '#B91C1C', fontSize: 13, lineHeight: 20 },
  record: { borderTopWidth: 1, borderTopColor: '#DCE8E2', paddingTop: 12, gap: 8 },
  screen: { flex: 1, backgroundColor: '#F2F8F5' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCE8E2' },
  heading: { flex: 1, fontSize: 17, fontWeight: '700', color: '#163A2C' }, close: { padding: 12, borderRadius: 10, backgroundColor: '#E6F5ED' },
  content: { padding: 16, gap: 16, width: '100%', maxWidth: 540, alignSelf: 'center', paddingBottom: 32 }, summary: { alignItems: 'center', gap: 10 },
  amount: { fontSize: 32, color: '#00875F', fontWeight: '800' }, badge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }, waiting: { backgroundColor: '#FEF3C7' }, success: { backgroundColor: '#BBF7D0' }, status: { fontWeight: '700', color: '#163A2C', textAlign: 'center' },
  qrCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#DCE8E2' }, countdown: { fontWeight: '700', color: '#956300', fontSize: 14 },
  centerNote: { color: '#64748B', fontSize: 12, lineHeight: 19, textAlign: 'center' }, notice: { padding: 16, borderRadius: 14, backgroundColor: '#E6F5ED', gap: 8 },
  details: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#DCE8E2' }, detailRow: { gap: 3, borderBottomWidth: 1, borderBottomColor: '#EEF2F0', paddingBottom: 10 }, detailValue: { color: '#163A2C', fontSize: 15, lineHeight: 22, fontWeight: '600', flexShrink: 1 },
});
