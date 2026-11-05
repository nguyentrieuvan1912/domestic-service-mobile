import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { operationRequest, operationSession } from '@/api/operations';
import type { ConnectedBooking } from '@/data/connectedBookings';

type Incident = { id: number; reason: string; status: string; created_at: string };
type Voucher = { code: string; description: string; expires_at: string; used_count: number; booking_id: number };
export function BookingComplaintPanel({ booking }: { booking: ConnectedBooking }) {
  const [items, setItems] = useState<Incident[]>([]), [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [reason, setReason] = useState(''), [staff, setStaff] = useState(''), [open, setOpen] = useState(false);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [attempt, setAttempt] = useState(0);
  const request = useRef({ signature: '', key: '' }), sending = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true; const owner = operationSession()?.token;
    Promise.all([operationRequest<Incident[]>('booking', `/bookings/${booking.id}/incidents`), operationRequest<Voucher[]>('catalog', '/customer/vouchers')])
      .then(([rows, coupons]) => { if(active && owner === operationSession()?.token) { setItems(rows); setVouchers(coupons.filter(c => String(c.booking_id) === booking.id)); setError(''); } })
      .catch(cause => { if(active) setError(cause instanceof Error ? cause.message : 'Chưa tải được khiếu nại.'); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [booking.id, attempt]));
  const submit = async () => {
    if(sending.current || !reason.trim())return;
    const signature = JSON.stringify({ reason: reason.trim(), staff, booking: booking.id });
    if(request.current.signature !== signature)request.current = { signature, key: `complaint-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    const owner = operationSession()?.token; sending.current = true; setBusy(true); setError(''); setNotice('');
    try { await operationRequest('booking', `/bookings/${booking.id}/incidents`, 'POST', { reason: reason.trim(), staffId: staff ? Number(staff) : null, requestKey: request.current.key });
      if(owner !== operationSession()?.token)return;
      setNotice('Đã gửi khiếu nại tới admin.'); setReason(''); setOpen(false); request.current = { signature: '', key: '' }; setAttempt(a => a + 1);
    } catch(cause) { setError(cause instanceof Error ? cause.message : 'Chưa gửi được khiếu nại.'); }
    finally { sending.current = false; setBusy(false); }
  };
  return <View style={{ marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
    <Text style={{ fontSize: 17, fontWeight: '700' }}>Khiếu nại & hỗ trợ đơn hàng</Text>
    <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 20 }}>Báo cáo chất lượng, thái độ hoặc tình trạng nhân viên để admin kiểm tra nhật ký của đúng đơn này.</Text>
    {loading && <ActivityIndicator />}{error ? <><Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text><Pressable onPress={() => setAttempt(a => a + 1)}><Text style={{ color: '#047857' }}>Thử lại</Text></Pressable></> : null}
    {notice ? <Text style={{ color: '#047857' }}>{notice}</Text> : null}
    {vouchers.map(v => <View key={v.code} style={{ backgroundColor: '#ecfdf5', padding: 12, borderRadius: 10, gap: 5 }}><Text selectable style={{ fontWeight: '700', color: '#047857' }}>Ưu đãi xin lỗi 5%: {v.code}</Text><Text style={{ fontSize: 12, color: '#475569' }}>{v.description} · {v.used_count ? 'Đã dùng' : `Hạn ${new Date(v.expires_at).toLocaleDateString('vi-VN')}`}</Text></View>)}
    {items.map(item => <View key={item.id} style={{ borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 10, gap: 4 }}><Text style={{ fontWeight: '600' }}>#{item.id} · {item.status === 'OPEN' ? 'Đang chờ admin xử lý' : 'Đã xử lý'}</Text><Text style={{ color: '#475569', lineHeight: 21 }}>{item.reason}</Text></View>)}
    <Pressable disabled={busy} onPress={() => setOpen(v => !v)} style={{ padding: 12, borderRadius: 10, backgroundColor: '#fff7ed' }}><Text style={{ color: '#c2410c', fontWeight: '600', textAlign: 'center' }}>{open ? 'Thu gọn' : 'Gửi khiếu nại cho admin'}</Text></Pressable>
    {open && <><Text style={{ fontWeight: '600' }}>Nhân viên liên quan</Text><Pressable onPress={() => setStaff('')}><Text style={{ color: staff === '' ? '#047857' : '#64748b' }}>○ Toàn bộ đơn / chưa xác định</Text></Pressable>{booking.assignments.map((a, i) => <Pressable key={`${a.staffId}-${i}`} onPress={() => setStaff(String(a.staffId))}><Text style={{ color: staff === String(a.staffId) ? '#047857' : '#64748b' }}>○ {String(a.staffSnapshot?.fullName || `Nhân viên #${a.staffId}`)}</Text></Pressable>)}<TextInput accessibilityLabel="Nội dung khiếu nại" multiline maxLength={2000} placeholder="Mô tả rõ sự việc, thời gian và nội dung cần kiểm tra…" value={reason} onChangeText={setReason} style={{ minHeight: 110, textAlignVertical: 'top', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12 }} /><Pressable disabled={busy || !reason.trim()} onPress={() => void submit()} style={{ backgroundColor: '#047857', borderRadius: 10, padding: 14, opacity: busy || !reason.trim() ? 0.5 : 1 }}><Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>{busy ? 'Đang gửi…' : 'Gửi khiếu nại'}</Text></Pressable></>}
  </View>;
}
