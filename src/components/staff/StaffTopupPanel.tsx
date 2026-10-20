import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { operationRequest, operationSession } from '@/api/operations';

type Capabilities = { topupEnabled: boolean; message: string; minimumTopup: number; maximumTopup: number };
type Topup = { id: number; amount: number; status: string; requestKey: string; checkoutUrl: string | null; amountReceived: number; createdAt: string; expiresAt: string };
const labels: Record<string, string> = { CREATING: 'Đang tạo / cần khôi phục', PENDING: 'Chờ chuyển khoản', PAID: 'Đã nhận tiền', CANCELLED: 'Đã hủy liên kết', EXPIRED: 'Hết hạn liên kết', REVIEW: 'Cần đối soát số tiền' };
const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export function StaffTopupPanel({ onCredited }: { onCredited: () => void }) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [items, setItems] = useState<Topup[]>([]);
  const [amount, setAmount] = useState('10000');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false), request = useRef({ key: 'topup-' + Date.now() + '-' + Math.random().toString(36).slice(2), amount: 10000 });
  const owner = useRef(operationSession()?.token);
  const paidIds = useRef(new Set<number>());
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const current = () => mounted.current && owner.current === operationSession()?.token;
  const load = useCallback(async (signal?: AbortSignal) => {
    const [cap, topups] = await Promise.all([
      operationRequest<Capabilities>('finance', '/payment-capabilities', 'GET', undefined, signal),
      operationRequest<Topup[]>('finance', '/staff/me/topups', 'GET', undefined, signal),
    ]);
    if (!current() || signal?.aborted) return;
    setCapabilities(cap); setItems(topups); setError('');
    const newlyPaid = topups.some(item => item.status === 'PAID' && !paidIds.current.has(item.id));
    topups.filter(item => item.status === 'PAID').forEach(item => paidIds.current.add(item.id));
    if (newlyPaid) onCredited();
  }, [onCredited]);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    const refresh = () => { if (AppState.currentState === 'active') void load(controller.signal).catch(cause => { if (current() && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được yêu cầu nạp.'); }); };
    refresh();
    const timer = setInterval(refresh, 10000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [load]));

  const execute = async (work: () => Promise<unknown>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await work(); if (current()) await load(); }
    catch (cause) { if (current()) { const message = cause instanceof Error ? cause.message : 'Chưa xử lý được.'; await load().catch(() => {}); if (current()) setError(message); } }
    finally { locked.current = false; if (current()) setBusy(false); }
  };
  const create = (previous?: Topup) => {
    const value = previous?.amount ?? Number(amount);
    if (!Number.isSafeInteger(value) || value < 2000 || value > 1000000) { setError('Nhập số tiền từ 2.000đ đến 1.000.000đ.'); return; }
    if (!previous && (request.current.amount !== value || items.some(item => item.requestKey === request.current.key && ['PAID', 'CANCELLED', 'EXPIRED'].includes(item.status)))) request.current = { key: 'topup-' + Date.now() + '-' + Math.random().toString(36).slice(2), amount: value };
    void execute(async () => {
      const item = await operationRequest<Topup>('finance', '/staff/me/topups', 'POST', { amount: value, requestKey: previous?.requestKey ?? request.current.key });
      if (current()) setItems(old => [item, ...old.filter(i => i.id !== item.id)]);
    });
  };
  return <View style={s.card}>
    <Text style={s.title}>Nạp tiền vào số dư</Text>
    <Text style={s.note}>{capabilities?.message || 'Đang kiểm tra kết nối thanh toán…'}</Text>
    <Text style={s.note}>Chuyển khoản theo mã riêng. Số dư chỉ tăng sau khi backend xác minh đã nhận đủ tiền; tiền nạp không tính là thu nhập ca làm.</Text>
    <TextInput accessibilityLabel="Số tiền nạp" keyboardType="number-pad" value={amount} editable={!busy} onChangeText={value => setAmount(value.replace(/\D/g, ''))} style={s.input} />
    <View style={s.wrap}>{[10000, 50000, 100000].map(value => <Pressable key={value} disabled={busy} onPress={() => setAmount(String(value))} style={s.chip}><Text style={s.link}>{money(value)}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" disabled={busy || !capabilities?.topupEnabled} onPress={() => create()} style={[s.button, (!capabilities?.topupEnabled || busy) && s.disabled]}><Text style={s.white}>{busy ? 'Đang xử lý…' : 'Tạo / mở lại yêu cầu nạp'}</Text></Pressable>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable disabled={busy} onPress={() => void execute(async () => {})} style={s.chip}><Text style={s.link}>Tải lại trạng thái</Text></Pressable>
    {items.slice(0, 10).map(item => <View key={item.id} style={s.record}>
      <Text style={s.title}>{money(item.amount)} · #{item.id}</Text>
      <Text style={item.status === 'PAID' ? s.link : s.note}>{labels[item.status] || item.status}</Text>
      <Text style={s.note}>{new Date(item.createdAt).toLocaleString('vi-VN')} · Đã nhận: {money(item.amountReceived)}</Text>
      {!['PAID', 'CANCELLED', 'EXPIRED'].includes(item.status) && <>
        {item.status === 'CREATING' && <Pressable disabled={busy} style={s.chip} onPress={() => create(item)}><Text style={s.link}>Khôi phục cùng mã yêu cầu</Text></Pressable>}
        {!!item.checkoutUrl && item.status !== 'REVIEW' && <Pressable disabled={busy} style={s.button} onPress={() => void execute(async () => {
          const url = new URL(item.checkoutUrl!);
          if (url.protocol !== 'https:' || url.hostname !== 'pay.payos.vn') throw new Error('Liên kết thanh toán không hợp lệ.');
          await WebBrowser.openBrowserAsync(item.checkoutUrl!);
        })}><Text style={s.white}>Mở mã QR trên payOS</Text></Pressable>}
        <Pressable disabled={busy} style={s.chip} onPress={() => void execute(() => operationRequest('finance', '/staff/me/topups/' + item.id + '/refresh', 'POST'))}><Text style={s.link}>Kiểm tra giao dịch với payOS</Text></Pressable>
      </>}
    </View>)}
  </View>;
}
const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, backgroundColor: '#fff', gap: 12, marginBottom: 16, borderWidth: 1, borderColor: '#DCE8E2' },
  title: { color: '#163A2C', fontWeight: '700', fontSize: 15 }, note: { color: '#64748B', fontSize: 12, lineHeight: 19 },
  input: { borderWidth: 1, borderColor: '#B4CDBF', padding: 13, borderRadius: 12, fontSize: 18, color: '#163A2C' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { padding: 12, borderRadius: 10, backgroundColor: '#EFF8F3', maxWidth: '100%' },
  link: { fontWeight: '700', fontSize: 13, color: '#00875F' }, button: { backgroundColor: '#00875F', padding: 14, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
  white: { textAlign: 'center', color: '#fff', fontWeight: '700' }, disabled: { opacity: 0.45 }, error: { color: '#B91C1C', fontSize: 13, lineHeight: 20 },
  record: { borderTopWidth: 1, borderTopColor: '#DCE8E2', paddingTop: 12, gap: 8 },
});
