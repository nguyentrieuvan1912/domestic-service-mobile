import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, BorderRadius } from '@/constants/theme';

export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <View style={styles.badge} pointerEvents="none" accessible={false}>
    <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
  </View>;
}
const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -3, right: -4, minWidth: 19, height: 19, paddingHorizontal: 4,
    borderRadius: BorderRadius.full, backgroundColor: BrandColors.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BrandColors.white },
  text: { color: BrandColors.white, fontSize: 10, fontWeight: '700' },
});
