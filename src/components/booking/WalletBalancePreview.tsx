import { useCallback, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { operationRequest } from '@/api/operations';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors } from '@/constants/theme';

/** The balance control belongs inside the wallet option on both payment-selection steps. */
export function WalletBalancePreview() {
  const { accessToken } = useAuth();
  return <WalletBalanceContent key={accessToken} />;
}
function WalletBalanceContent() {
  const [visible, setVisible] = useState(false), [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    if (!visible) return;
    const controller = new AbortController(); let running = false;
    const refresh = async () => {
      if (running || AppState.currentState !== 'active') return;
      running = true; setLoading(true);
      try {
        const wallet = await operationRequest<{ available: number }>('finance', '/customer/me/wallet', 'GET', undefined, controller.signal);
        if (!controller.signal.aborted) { setBalance(wallet.available); setError(''); }
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được số dư.'); }
      finally { running = false; if (!controller.signal.aborted) setLoading(false); }
    };
    void refresh(); const timer = setInterval(() => void refresh(), 10000);
    const listener = AppState.addEventListener('change', () => void refresh());
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [visible]));
  return <View style={styles.container}>
    <View style={styles.row}>
      <Text style={styles.label}>Số dư ví:</Text>
      <Text style={styles.amount}>{!visible ? '••••••' : error ? 'Chưa tải được' : balance === null ? 'Đang tải…' : balance.toLocaleString('vi-VN') + 'đ'}</Text>
      {visible && loading && <ActivityIndicator size="small" color={BrandColors.primaryDark} />}
      <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ẩn số dư ví' : 'Xem số dư ví'} accessibilityState={{ selected: visible }} onPress={event => { event.stopPropagation(); setVisible(previous => !previous); }} style={({ pressed }) => [styles.eye, pressed && { opacity: 0.6 }]}>
        <IconSymbol name={visible ? 'eyeOff' : 'eye'} size={21} color={BrandColors.primaryDark} />
      </Pressable>
    </View>
    {visible && !!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { marginTop: 5 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 6 },
  label: { color: '#688171', fontSize: 12 }, amount: { fontSize: 13, fontWeight: '700', color: BrandColors.primaryDark },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#E9F6EE', marginLeft: 2 },
  error: { fontSize: 11, color: '#B91C1C', lineHeight: 17, marginTop: 4 },
});
