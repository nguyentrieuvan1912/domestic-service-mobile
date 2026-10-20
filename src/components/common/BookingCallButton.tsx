import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { operationRequest } from '@/api/operations';
import { callKey, supportsNativeCalls, type BookingCall } from '@/api/bookingCalls';
export function BookingCallButton({ conversationId, disabled = false }: { conversationId: string; disabled?: boolean }) {
  const router = useRouter(), [busy, setBusy] = useState(false), key = useRef(callKey()), locked = useRef(false);
  return <Pressable accessibilityRole="button" accessibilityLabel="Gọi trong đơn hàng" disabled={disabled || busy} style={[s.button, (disabled || busy) && { opacity: 0.4 }]} onPress={async () => {
    if (!supportsNativeCalls()) { Alert.alert('Cần bản cài hỗ trợ cuộc gọi', 'WebRTC / LiveKit cần development build. Expo Go hiện tại vẫn dùng được nhắn tin.'); return; }
    if (locked.current) return; locked.current = true; setBusy(true);
    try { const call = await operationRequest<BookingCall>('booking', `/conversations/${conversationId}/calls`, 'POST', { requestKey: key.current }); key.current = callKey(); router.push({ pathname: '/call/[id]', params: { id: String(call.id) } }); }
    catch (cause) { Alert.alert('Chưa gọi được', cause instanceof Error ? cause.message : 'Vui lòng thử lại.'); }
    finally { locked.current = false; setBusy(false); }
  }}><Text style={s.text}>{busy ? 'Đợi…' : '☎ Gọi'}</Text></Pressable>;
}
const s = StyleSheet.create({ button: { minHeight: 44, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5', justifyContent: 'center' }, text: { color: '#00875F', fontWeight: '700', fontSize: 13 } });
