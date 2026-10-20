import { useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AdministrativeUnit, administrativeSearchKey } from '@/api/administrative-units';
import { BorderRadius, BrandColors } from '@/constants/theme';

type Props = { value: string; onChange: (value: string) => void; units: AdministrativeUnit[]; loading: boolean; error: string; retry: () => void; disabled?: boolean };
export function WardSelect({ value, onChange, units, loading, error, retry, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [browsing, setBrowsing] = useState(true);
  const selected = units.some(unit => unit.name === value);
  const query = administrativeSearchKey(browsing ? '' : value);
  const filtered = units.filter(unit => administrativeSearchKey(unit.name).includes(query));
  return <View>
    <View style={styles.inputRow}>
      <TextInput accessibilityLabel="Phường/Xã" value={value} onChangeText={text => { onChange(text); setBrowsing(false); setExpanded(true); }} onFocus={() => { setBrowsing(selected); setExpanded(true); }} editable={!disabled && !loading} placeholder="Nhập tên hoặc chọn phường/xã" autoCorrect={false} style={styles.input} />
      <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Thu gọn danh sách phường/xã' : 'Mở danh sách phường/xã'} onPress={() => { Keyboard.dismiss(); setBrowsing(selected); setExpanded(!expanded); }} disabled={disabled || loading} style={styles.toggle}>
        {loading ? <ActivityIndicator size="small" color={BrandColors.primary} /> : <Text style={styles.arrow}>{expanded ? '⌃' : '⌄'}</Text>}
      </Pressable>
    </View>
    <Text style={styles.hint}>TP. Hồ Chí Minh • Phường, xã, đặc khu</Text>
    {error ? <Pressable accessibilityRole="button" onPress={retry}><Text style={styles.error}>{error} Bấm để tải lại.</Text></Pressable> : null}
    {expanded && !loading && !error && <View style={styles.dropdown}>
      <Text style={styles.count}>{filtered.length} đơn vị • Kéo để chọn</Text>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.list}>
        {filtered.map(unit => <Pressable key={unit.id} accessibilityRole="button" accessibilityLabel={`Chọn ${unit.name}`} disabled={disabled} onPress={() => { onChange(unit.name); setExpanded(false); Keyboard.dismiss(); }} style={[styles.option, value === unit.name && styles.selected]}>
          <Text style={styles.optionText}>{unit.name}</Text>{value === unit.name && <Text style={styles.check}>✓</Text>}
        </Pressable>)}
        {!filtered.length && <Text style={styles.empty}>Không tìm thấy. Thử tên khác hoặc nhập không dấu.</Text>}
      </ScrollView>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: BorderRadius.lg },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: BrandColors.gray900 },
  toggle: { paddingHorizontal: 14, paddingVertical: 7 }, arrow: { fontSize: 21, color: BrandColors.gray700 },
  hint: { marginTop: 4, fontSize: 11, color: BrandColors.gray500 }, error: { marginTop: 6, color: '#B91C1C', fontSize: 12 },
  dropdown: { marginTop: 6, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: '#FFF' },
  count: { paddingHorizontal: 12, paddingVertical: 7, fontSize: 11, color: BrandColors.gray500, backgroundColor: '#F8FAFC' }, list: { maxHeight: 180 },
  option: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  optionText: { fontSize: 13, color: BrandColors.gray900 }, selected: { backgroundColor: '#ECFDF5' }, check: { color: BrandColors.primary }, empty: { padding: 12, fontSize: 12, color: BrandColors.gray500 },
});
