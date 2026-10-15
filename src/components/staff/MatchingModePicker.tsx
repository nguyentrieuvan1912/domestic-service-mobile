import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';
export { matchingModeCounts } from '@/utils/staff-matching-mode';

export function MatchingModePicker({ value, onChange, invitations, open }: { value: 'A' | 'B'; onChange: (mode: 'A' | 'B') => void; invitations: number; open: number }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const focused = useIsFocused();
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const update = (reduced: boolean) => {
      animation?.stop(); opacity.setValue(1);
      if (active && focused && invitations > 0 && !reduced) {
        animation = Animated.loop(Animated.sequence([
          Animated.timing(opacity, { toValue: 0.65, duration: 1300, useNativeDriver: true, isInteraction: false }),
          Animated.timing(opacity, { toValue: 1, duration: 1300, useNativeDriver: true, isInteraction: false }),
        ]));
        animation.start();
      }
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(false));
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { active = false; animation?.stop(); listener.remove(); opacity.setValue(1); };
  }, [invitations > 0, focused, opacity]);
  return <View style={styles.row}>
    <Animated.View style={[styles.grow, { opacity }]}><Pressable accessibilityRole="button" accessibilityLabel={`Khách chọn bạn, ${invitations} đơn chờ nhận`} accessibilityState={{ selected: value === 'A' }} onPress={() => onChange('A')} style={[styles.button, value === 'A' && styles.selected, invitations > 0 && styles.alert]}>
      <Text style={[styles.text, (value === 'A' || invitations > 0) && styles.light]}>Khách chọn bạn</Text><Text style={[styles.count, (value === 'A' || invitations > 0) && styles.light]}>{invitations}</Text>
    </Pressable></Animated.View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Tìm việc, ${open} đơn phù hợp`} accessibilityState={{ selected: value === 'B' }} onPress={() => onChange('B')} style={[styles.button, styles.grow, value === 'B' && styles.selected]}><Text style={[styles.text, value === 'B' && styles.light]}>Tìm việc</Text><Text style={[styles.count, value === 'B' && styles.light]}>{open}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 }, grow: { flex: 1 },
  button: { minHeight: 54, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  selected: { backgroundColor: '#00875F', borderColor: '#00875F' }, alert: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  text: { fontSize: 13, fontWeight: '700', color: '#334155' }, count: { fontSize: 13, fontWeight: '800', color: '#00875F' }, light: { color: '#fff' },
});
