import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { ConnectedBooking, CustomerBookings } from '@/data/connectedBookings';
import { remoteImageSource } from '@/utils/image-source';
import { needsStaffResponse, responseClock, responseSeconds } from '@/utils/staff-response';
import { useAuth } from '@/context/AuthContext';

export function StaffResponseWaiting({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const [booking, setBooking] = useState<ConnectedBooking>();
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now);
  const [attempt, setAttempt] = useState(0);
  const offset = useRef(0), generation = useRef(0), refresh = useRef<() => void>(() => {});
  const busy = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!currentCustomer || !/^\d+$/.test(bookingId)) return;
    let active = true, inFlight = false, finished = false;
    const load = async () => {
      if (inFlight || finished || busy.current || AppState.currentState === 'background') return;
      inFlight = true; const version = generation.current;
      try {
        const next = await CustomerBookings.detail(bookingId);
        if (!active || version !== generation.current) return;
        offset.current = Date.parse(next.serverNow || new Date().toISOString()) - Date.now();
        setNow(Date.now() + offset.current); setBooking(next); setError(''); finished = !needsStaffResponse(next);
      } catch (cause) { if (active && version === generation.current) setError(cause instanceof Error ? cause.message : 'Chưa tải được trạng thái đơn.'); }
      finally { inFlight = false; }
    };
    refresh.current = () => { void load(); };
    void load();
    const poll = setInterval(() => void load(), 3000);
    const clock = setInterval(() => setNow(Date.now() + offset.current), 1000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { active = false; refresh.current = () => {}; clearInterval(poll); clearInterval(clock); listener.remove(); };
  }, [bookingId, currentCustomer?.id, attempt]));
  const seconds = responseSeconds(booking?.staffResponseDeadline, now);
  useEffect(() => { if (booking?.staffWaitState === 'WAITING' && seconds === 0) refresh.current(); }, [booking?.staffResponseDeadline, booking?.staffWaitState, seconds]);

  const waiting = !!booking && needsStaffResponse(booking);
  const expired = booking?.staffWaitState === 'EXPIRED' && booking.status === 'CANCELLED';
  const accepted = !!booking && ['CONFIRMED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const name = String(booking?.staff?.fullName || 'nhân viên');
  return <LinearGradient colors={BrandColors.softBgGradient} locations={BrandColors.softBgGradientLocations} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        {!booking ? <ActivityIndicator color={BrandColors.primary} size="large" /> : <>
          <View style={styles.aura}><Image source={remoteImageSource(String(booking.staff?.avatar || '/api/v1/identity/staff-avatar.png'))} style={styles.avatar} /></View>
          <Text style={styles.title}>{accepted ? `${name} đã nhận đơn!` : expired ? `${name} chưa nhận đơn` : waiting ? `Đang chờ ${name} xác nhận...` : 'Đơn đã kết thúc'}</Text>
          <Text style={styles.subtitle}>{accepted ? 'Bạn có thể xem chi tiết và theo dõi ca làm việc.' : waiting ? 'Yêu cầu đã được gửi trực tiếp đến nhân viên. Mỗi lượt chờ tối đa 5 phút.' : booking.cancellationReason || 'Vui lòng xem lại chi tiết đơn hàng.'}</Text>
          {waiting && <View style={styles.badge}><IconSymbol name="clock" size={18} color={BrandColors.primary} /><Text style={styles.badgeText}>{expired ? 'Đã hết thời gian nhận đơn' : seconds > 0 ? `Thời gian chờ còn lại: ${responseClock(seconds)}` : 'Đang kiểm tra phản hồi của nhân viên...'}</Text></View>}
          <Text style={styles.code}>Mã đơn: {booking.bookingCode}</Text>
          {waiting && <View style={styles.notice}><IconSymbol name="info" size={20} color={BrandColors.primary} /><Text style={styles.noticeText}>Bạn có thể về trang chủ và mở lại đơn đang chờ ở đầu trang. Hết giờ, bạn có thể chờ thêm 5 phút hoặc hủy để tìm nhân viên khác.</Text></View>}
          {booking.mode === 'MODE_A' && ['NO_STAFF_FOUND', 'REJECTED'].includes(booking.status) && <Pressable style={styles.primary} onPress={() => router.replace({ pathname: '/booking/rebook', params: { sourceId: booking.id, replaceStaff: '1' } })}><Text style={styles.primaryText}>Chọn nhân viên khác / Hệ thống ghép</Text></Pressable>}
          {!waiting && <Pressable style={styles.primary} onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: booking.id } })}><Text style={styles.primaryText}>Xem chi tiết đơn</Text></Pressable>}
        </>}
        {!!error && <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={() => setAttempt(value => value + 1)}><Text style={styles.link}>Tải lại trạng thái đơn</Text></Pressable></View>}
        <Pressable style={styles.home} onPress={() => router.replace('/(tabs)')}><IconSymbol name="home" size={20} color={BrandColors.primary} /><Text style={styles.link}>Về trang chủ</Text></Pressable>
      </ScrollView>
      {booking && <StaffResponseDecision booking={booking}
        onPending={value => { busy.current = value; generation.current++; }}
        onUpdated={next => { offset.current = Date.parse(next.serverNow || new Date().toISOString()) - Date.now(); setNow(Date.now() + offset.current); setBooking(next); }} />}

    </SafeAreaView>
  </LinearGradient>;
}

/** Shared by the waiting page and homepage; only the focused screen can present it. */
export function StaffResponseDecision({ booking, onPending, onUpdated }: { booking: ConnectedBooking; onPending?: (value: boolean) => void; onUpdated?: (booking: ConnectedBooking) => void }) {
  const router = useRouter(), focused = useIsFocused();
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  const expired = booking.staffWaitState === 'EXPIRED' && booking.status === 'CANCELLED';
  const name = String(booking.staff?.fullName || 'Nhân viên');
  const decide = async (action: 'EXTEND' | 'CANCEL' | 'STOP') => {
    if(busy.current) return;
    busy.current = true; setSaving(true); setError(''); onPending?.(true);
    try {
      const next = await CustomerBookings.staffResponse(booking.id, action, booking.staffWaitRound || 1);
      onUpdated?.(next);
      if(action === 'CANCEL') router.replace({ pathname: '/booking/rebook', params: { sourceId: next.id, replaceStaff: '1' } });
      if(action === 'STOP') router.replace('/(tabs)');
    } catch(cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được lựa chọn. Vui lòng thử lại.'); }
    finally { busy.current = false; setSaving(false); onPending?.(false); }
  };
  return (
      <Modal visible={focused && expired} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.overlay}><View style={styles.dialog}>
          <IconSymbol name="clock" size={36} color={BrandColors.primary} />
          <Text style={styles.title}>Nhân viên bạn chọn đang bận</Text>
          <Text style={styles.subtitle}>{name} chưa phản hồi trong thời gian nhận đơn. Bạn có muốn chờ thêm 5 phút không?</Text>
          <Text style={styles.subtitle}>Nếu tìm nhân viên khác, đơn này sẽ được giữ trong lịch sử với lý do hết thời gian nhận đơn.</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={saving} style={[styles.primary, saving && { opacity: 0.6 }]} onPress={() => void decide('EXTEND')}><Text style={styles.primaryText}>{saving ? 'Đang cập nhật...' : 'Có, chờ thêm 5 phút'}</Text></Pressable>
          <Pressable disabled={saving} style={styles.home} onPress={() => void decide('CANCEL')}><Text style={styles.link}>Không, tìm nhân viên khác</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={saving} style={styles.cancel} onPress={() => void decide('STOP')}><Text style={styles.error}>Hủy đặt dịch vụ, về trang chủ</Text></Pressable>
        </View></View>
      </Modal>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 18 },
  aura: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#00B884', borderRadius: 90, padding: 18, marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', backgroundColor: '#DCFCE7' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, color: '#475569', textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, padding: 12, backgroundColor: '#DFF8ED' },
  badgeText: { fontSize: 14, fontWeight: '700', color: '#00875F', fontVariant: ['tabular-nums'] },
  code: { fontSize: 12, color: '#64748B' },
  notice: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DBE5EF', borderRadius: 14 },
  noticeText: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 21 },
  primary: { alignSelf: 'stretch', alignItems: 'center', padding: 16, backgroundColor: '#00AE7C', borderRadius: 12 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  home: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 14 },
  cancel: { alignSelf: 'stretch', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#FECACA', borderRadius: 12 },
  link: { color: '#00875F', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  errorBox: { gap: 10 }, error: { color: '#B91C1C', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: '#0F172A80', padding: 20 },
  dialog: { width: '100%', maxWidth: 440, alignSelf: 'center', alignItems: 'center', gap: 18, backgroundColor: '#fff', borderRadius: 22, padding: 24 },
});
