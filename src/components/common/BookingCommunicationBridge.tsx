import { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { operationRequest, operationSession } from '@/api/operations';
import { callAction, type BookingCall } from '@/api/bookingCalls';

// Native imports stay deferred: existing Expo Go sessions can still use bookings and chat.
export function BookingCommunicationBridge() {
  const { currentUser } = useAuth(), router = useRouter(), path = usePathname();
  const [incoming, setIncoming] = useState<BookingCall | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true, reading = false; const abort = new AbortController(), owner = operationSession()?.token;
    const poll = async () => {
      if (reading || AppState.currentState !== 'active') return; reading = true;
      try { const rows = await operationRequest<BookingCall[]>('booking', '/calls/incoming', 'GET', undefined, abort.signal); if (alive) setIncoming(rows[0] || null); }
      catch { /* The notification inbox remains usable during a transient call poll outage. */ }
      finally { reading = false; }
    };
    const navigate = (data: Record<string, unknown>) => {
      if (!alive || owner !== operationSession()?.token) return;
      if (data.type === 'CALL_INCOMING' && data.callId) router.push({ pathname: '/call/[id]', params: { id: String(data.callId) } });
      else if (data.bookingId) router.push(currentUser?.role === 'STAFF' ? { pathname: '/staff/job-detail', params: { id: String(data.bookingId) } } : { pathname: '/booking/[id]', params: { id: String(data.bookingId) } });
    };
    let remove: (() => void) | undefined, registered = false, registering = false;
    const register = async () => {
      if (registered || registering || Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient') return;
      registering = true;
      try {
      const notifications = await import('expo-notifications');
      if (!alive) return; remove?.();
      notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
      if (Platform.OS === 'android') {
        await notifications.setNotificationChannelAsync('booking-reminders', { name: 'Nhắc ca làm việc', importance: notifications.AndroidImportance.HIGH, sound: 'default' });
        await notifications.setNotificationChannelAsync('booking-calls', { name: 'Cuộc gọi đơn hàng', importance: notifications.AndroidImportance.MAX, sound: 'default' });
      }
      const sub = notifications.addNotificationResponseReceivedListener(response => navigate(response.notification.request.content.data || {}));
      remove = () => sub.remove();
      const response = await notifications.getLastNotificationResponseAsync();
      if (response) { navigate(response.notification.request.content.data || {}); await notifications.clearLastNotificationResponseAsync(); }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) return;
      let permission = await notifications.getPermissionsAsync();
      if (!permission.granted) permission = await notifications.requestPermissionsAsync();
      if (!permission.granted || !alive) return;
      const token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
      if (alive && owner === operationSession()?.token) { await operationRequest('identity', '/push/devices', 'POST', { token, platform: Platform.OS }); registered = true; }
      } finally { registering = false; }
    };
    void poll(); void register().catch(() => { /* Registration retries on the next foreground entry. */ });
    const timer = setInterval(poll, 5000), subscription = AppState.addEventListener('change', state => { if (state === 'active') { void poll(); if (!registered) void register().catch(() => {}); } });
    return () => { alive = false; abort.abort(); clearInterval(timer); subscription.remove(); remove?.(); };
  }, [currentUser?.id, currentUser?.role, router]);
  if (!incoming || path.startsWith('/call/')) return null;
  return <View style={s.banner}><Text style={s.title}>☎ Cuộc gọi về đơn #{incoming.bookingId}</Text><Text style={s.note}>Khách hàng / nhân viên của đơn đang gọi cho bạn.</Text>{!!error && <Text style={s.error}>{error}</Text>}<View style={s.row}><Pressable disabled={busy} style={s.accept} onPress={() => router.push({ pathname: '/call/[id]', params: { id: String(incoming.id) } })}><Text style={s.white}>Mở cuộc gọi</Text></Pressable><Pressable disabled={busy} style={s.decline} onPress={async () => { setBusy(true); try { await callAction(String(incoming.id), 'DECLINE'); setIncoming(null); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa từ chối được.'); } finally { setBusy(false); } }}><Text style={s.error}>Từ chối</Text></Pressable></View></View>;
}
const s = StyleSheet.create({ banner: { position: 'absolute', top: 55, left: 12, right: 12, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#00A675', backgroundColor: '#ECFDF5', gap: 8, elevation: 12 }, title: { fontWeight: '800', fontSize: 16, color: '#065F46' }, note: { color: '#475569', fontSize: 13 }, row: { flexDirection: 'row', gap: 12 }, accept: { minHeight: 44, backgroundColor: '#00875F', borderRadius: 10, padding: 12 }, decline: { minHeight: 44, borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, padding: 12 }, white: { color: '#fff', fontWeight: '700' }, error: { color: '#B91C1C' } });
