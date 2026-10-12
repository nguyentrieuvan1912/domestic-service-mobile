import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { BrandColors } from '@/constants/theme';

export function CatalogState({ loading, error, onRetry }: { loading?: boolean; error?: string; onRetry?: () => void }) {
  return <View style={styles.container} accessibilityRole={error ? 'alert' : undefined}>
    {loading && <ActivityIndicator color={BrandColors.primary} />}
    <Text style={styles.message}>{loading ? 'Đang tải dịch vụ...' : error || 'Chưa có dịch vụ phù hợp.'}</Text>
    {!!error && onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}><Text style={styles.buttonText}>Thử lại</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24, gap: 12 },
  message: { color: BrandColors.gray600, textAlign: 'center', lineHeight: 22 },
  button: { borderRadius: 24, backgroundColor: BrandColors.primary, paddingHorizontal: 22, paddingVertical: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
