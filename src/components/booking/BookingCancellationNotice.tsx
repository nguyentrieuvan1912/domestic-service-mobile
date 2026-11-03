import { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { dismissBookingCancellationNotice, getBookingCancellationNotice, subscribeBookingCancellationNotice } from '@/data/bookingCancellationNotice';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors } from '@/constants/theme';

export function BookingCancellationNotice() {
  const notice = useSyncExternalStore(subscribeBookingCancellationNotice, getBookingCancellationNotice, getBookingCancellationNotice);
  const router = useRouter();
  if (!notice) return null;
  return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismissBookingCancellationNotice}>
    <View style={s.overlay}><View accessibilityViewIsModal style={s.dialog}>
      <View style={s.icon}><IconSymbol name={notice.showWallet ? 'wallet' : 'check'} size={32} color={BrandColors.primaryDark} /></View>
      <Text accessibilityRole="header" style={s.title}>{notice.title}</Text>
      <Text style={s.message}>{notice.message}</Text>
      <Pressable accessibilityRole="button" onPress={dismissBookingCancellationNotice} style={({ pressed }) => [s.primary, pressed && s.pressed]}><Text style={s.primaryText}>Đã hiểu</Text></Pressable>
      {notice.showWallet && <Pressable accessibilityRole="button" onPress={() => { dismissBookingCancellationNotice(); router.push('/account/wallet'); }} style={({ pressed }) => [s.secondary, pressed && s.pressed]}><Text style={s.secondaryText}>Xem ví của tôi</Text><IconSymbol name="chevronRight" size={16} color={BrandColors.primaryDark} /></Pressable>}
    </View></View>
  </Modal>;
}
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,35,25,0.48)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 17 },
  icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#E7F6EE', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#173B2F', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 23, color: '#667D6E', textAlign: 'center' },
  primary: { alignSelf: 'stretch', minHeight: 50, padding: 14, borderRadius: 14, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  secondary: { alignSelf: 'stretch', minHeight: 48, flexDirection: 'row', gap: 7, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D9EBDD', justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontSize: 13, fontWeight: '700', color: BrandColors.primaryDark }, pressed: { opacity: 0.65 },
});
