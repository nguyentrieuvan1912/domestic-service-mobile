import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { administrativeSearchKey } from '@/api/administrative-units';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import type { Service } from '@/types/service';

type Props = {
  services: readonly Pick<Service, 'id' | 'name' | 'category'>[];
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
};

export function ServicePreferencePicker({ services, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState('');
  const options = services.filter(item => administrativeSearchKey(item.name).includes(administrativeSearchKey(query)));
  return <View style={styles.container}>
    <Text style={styles.title}>Bạn muốn tìm dịch vụ nào?</Text>
    <Text style={styles.description}>Chọn một hoặc nhiều dịch vụ ưu tiên. Hệ thống chỉ hiển thị nhân viên có thể thực hiện ít nhất một dịch vụ đã chọn và phù hợp địa chỉ, lịch làm việc.</Text>
    <View style={styles.searchBox}>
      <IconSymbol name="search" size={20} color={BrandColors.gray500} />
      <TextInput accessibilityLabel="Tìm kiếm dịch vụ" placeholder="Nhập tên dịch vụ, có hoặc không dấu" value={query} onChangeText={setQuery} style={styles.input} />
      {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm dịch vụ" hitSlop={8} onPress={() => setQuery('')}><IconSymbol name="close" size={18} color={BrandColors.gray500} /></Pressable>}
    </View>
    <Pressable accessibilityRole="checkbox" accessibilityLabel="Tất cả dịch vụ" accessibilityState={{ checked: selectedIds.length === 0 }} style={[styles.option, selectedIds.length === 0 && styles.selected]} onPress={() => onChange([])}>
      <View style={styles.iconBox}><IconSymbol name="OTHER_SERVICES" size={40} /></View>
      <View style={styles.optionContent}><Text style={styles.optionTitle}>Tất cả dịch vụ</Text><Text style={styles.description}>Hiển thị tất cả nhân viên phù hợp địa chỉ và ngày giờ.</Text></View>
      <View style={[styles.check, selectedIds.length === 0 && styles.checkSelected]}>{selectedIds.length === 0 && <IconSymbol name="check" size={15} color="#fff" />}</View>
    </Pressable>
    {options.map(item => {
      const checked = selectedIds.includes(item.id);
      return <Pressable key={item.id} accessibilityRole="checkbox" accessibilityLabel={item.name} accessibilityState={{ checked }} style={[styles.option, checked && styles.selected]} onPress={() => onChange(checked ? selectedIds.filter(id => id !== item.id) : [...selectedIds, item.id])}>
        <View style={styles.iconBox}><IconSymbol name={item.category} size={40} /></View>
        <View style={styles.optionContent}><Text style={styles.optionTitle}>{item.name}</Text></View>
        <View style={[styles.check, checked && styles.checkSelected]}>{checked && <IconSymbol name="check" size={15} color="#fff" />}</View>
      </Pressable>;
    })}
    {!options.length && <Text style={styles.description}>Không tìm thấy dịch vụ. Hãy thử tên khác.</Text>}
    <Text style={styles.description}>{selectedIds.length ? `Đã chọn ${selectedIds.length} dịch vụ ưu tiên.` : 'Đang chọn tất cả dịch vụ.'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: BrandColors.gray900 },
  description: { fontSize: 14, lineHeight: 21, color: BrandColors.gray600 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#DCE5E8', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  input: { flex: 1, minWidth: 0, paddingVertical: 14, color: BrandColors.gray900, fontSize: 14 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 1, borderColor: '#DCE5E8', borderRadius: 14, backgroundColor: '#fff' },
  iconBox: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F0FAF6' },
  optionContent: { flex: 1, gap: 6 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
  selected: { borderColor: BrandColors.primary, backgroundColor: '#ECFDF5' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: BrandColors.gray900 },
});
