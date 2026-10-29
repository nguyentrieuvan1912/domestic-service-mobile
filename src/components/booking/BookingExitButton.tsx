import { Alert, Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

/** Discard only the in-memory wizard. Persisted bookings have their own cancellation flow. */
export function BookingExitButton({ disabled = false, saved = false }: { disabled?: boolean; saved?: boolean }) {
  const router = useRouter();
  const leave = () => { Keyboard.dismiss(); router.dismissTo('/(tabs)'); };
  const requestExit = () => {
    if (disabled) return;
    if (saved) { leave(); return; }
    Keyboard.dismiss();
    Alert.alert('Hủy quá trình đặt dịch vụ?', 'Thông tin đang chọn trong lần đặt này sẽ được bỏ. Bạn sẽ trở về Trang chủ.', [
      { text: 'Tiếp tục đặt', style: 'cancel' },
      { text: 'Hủy đặt dịch vụ', style: 'destructive', onPress: leave },
    ]);
  };
  return <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Về trang chủ' : 'Hủy đặt dịch vụ và về trang chủ'}
    accessibilityState={{ disabled }} disabled={disabled} onPress={requestExit} hitSlop={6}
    style={[styles.button, disabled && styles.disabled, saved && styles.home]}>
    <Text style={[styles.text, saved && styles.homeText]}>{saved ? 'Trang chủ' : 'Hủy đặt'}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, alignSelf: 'center' },
  text: { color: '#BE123C', fontWeight: '700', fontSize: 12 }, disabled: { opacity: 0.45 },
  home: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }, homeText: { color: '#047857' },
});
