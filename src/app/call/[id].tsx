import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { callAction, getCall, supportsNativeCalls, type BookingCall } from '@/api/bookingCalls';
import { operationRequest } from '@/api/operations';
const Room = lazy(() => import('@/components/common/BookingCallRoom'));
export default function BookingCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(), { currentUser } = useAuth(), router = useRouter();
  const [call, setCall] = useState<BookingCall | null>(null), [credentials, setCredentials] = useState<{ serverUrl: string; token: string } | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [stopped, setStopped] = useState(false);
  const joining = useRef(false), locked = useRef(false), endRef = useRef<() => void>(() => {});
  useEffect(() => {
    let alive = true, reading = false; const abort = new AbortController();
    const refresh = async () => { if (reading || AppState.currentState !== 'active') return; reading = true;
      try { const result = await getCall(id); if (!alive) return; setCall(result);
        if (!['RINGING', 'ACCEPTED'].includes(result.status)) { setCredentials(null); setStopped(true); }
        else if (!joining.current && supportsNativeCalls() && (result.status === 'ACCEPTED' || String(result.callerId) === currentUser?.id)) {
          joining.current = true; try { const result = await operationRequest<{ serverUrl: string; token: string }>('booking', `/calls/${id}/token`, 'POST', undefined, abort.signal); if (alive) setCredentials(result); } catch (cause) { joining.current = false; throw cause; }
        }
      } catch (cause) { if (alive) setError(cause instanceof Error ? cause.message : 'Chưa tải được cuộc gọi.'); } finally { reading = false; }
    };
    void refresh(); const timer = setInterval(refresh, 2000); return () => { alive = false; abort.abort(); clearInterval(timer); };
  }, [id, currentUser?.id]);
  const action = async (value: 'ACCEPT' | 'DECLINE' | 'END') => {
    if (locked.current) return; locked.current = true; setBusy(true); setError('');
    if (value !== 'ACCEPT') { setStopped(true); setCredentials(null); }
    try { const result = await callAction(id, value); setCall(result); if (value !== 'ACCEPT') router.back(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được cuộc gọi.'); }
    finally { locked.current = false; setBusy(false); }
  };
  endRef.current = () => { void action('END'); };
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { endRef.current(); return true; }); return () => sub.remove(); }, []);
  const incoming = call?.status === 'RINGING' && String(call.calleeId) === currentUser?.id;
  return <SafeAreaView style={s.screen}><Text style={s.title}>Cuộc gọi trong đơn #{call?.bookingId || ''}</Text>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!supportsNativeCalls() && <Text style={s.note}>Cần development build có WebRTC để nghe/gọi. Expo Go không hỗ trợ chức năng này.</Text>}
    {incoming && !stopped ? <View style={s.box}><Text style={s.note}>Có cuộc gọi đến về đơn hàng này.</Text><Pressable disabled={busy || !supportsNativeCalls()} style={s.accept} onPress={() => void action('ACCEPT')}><Text style={s.white}>Nghe cuộc gọi</Text></Pressable><Pressable disabled={busy} style={s.end} onPress={() => void action('DECLINE')}><Text style={s.white}>Từ chối</Text></Pressable></View> : credentials && !stopped ? <Suspense fallback={<Text style={s.note}>Đang mở phòng gọi…</Text>}><Room {...credentials} onEnd={() => void action('END')} /></Suspense> : <View style={s.box}><Text style={s.note}>{stopped ? 'Cuộc gọi đã ngắt trên thiết bị.' : 'Đang chuẩn bị cuộc gọi…'}</Text><Pressable disabled={busy} style={s.end} onPress={() => void action('END')}><Text style={s.white}>{busy ? 'Đang cập nhật…' : error ? 'Thử kết thúc lại' : 'Đóng cuộc gọi'}</Text></Pressable></View>}
  </SafeAreaView>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#102620' }, title: { fontWeight: '800', fontSize: 18, color: '#fff', padding: 16 }, box: { padding: 20, gap: 16 }, note: { color: '#D1FAE5', lineHeight: 22, padding: 12 }, error: { color: '#FECACA', padding: 14 }, accept: { minHeight: 48, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#00875F' }, end: { minHeight: 48, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#B91C1C' }, white: { color: '#fff', fontWeight: '700' } });
