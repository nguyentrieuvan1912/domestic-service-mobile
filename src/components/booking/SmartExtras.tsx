import React, { useState } from 'react';
import { View, Text, Image, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { formatVND } from '@/components/common/Badge';
import { BookingExtra, conflictsWithSelection, getExtraTotals, getSuggestedExtras } from '@/utils/booking-extras';

interface Props {
  options: BookingExtra[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}

export function SmartExtras({ options, selectedKeys, onToggle, onClear }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ADD_ON' | 'SERVICE'>('ALL');
  const suggested = getSuggestedExtras(options);
  const { selected, addOnsTotal, servicesTotal, addOnMinutes } = getExtraTotals(options, selectedKeys);

  const renderCard = (extra: BookingExtra) => {
    const isSelected = selectedKeys.includes(extra.key);
    const blocked = !isSelected && conflictsWithSelection(extra, options, selectedKeys);
    return (
      <View key={extra.key} style={[styles.card, isSelected && styles.selectedCard]}>
        <Image source={{ uri: extra.image }} style={styles.image} accessibilityIgnoresInvertColors />
        <View style={styles.info}>
          <Text style={styles.kind}>{extra.kind === 'ADD_ON' ? 'Bổ sung' : 'Dịch vụ liên quan'}</Text>
          <Text style={styles.name}>{extra.name}</Text>
          {extra.kind === 'SERVICE' && <Text style={styles.scope}>{extra.scope}</Text>}
          <Text style={styles.reason}>{extra.reason}</Text>
          <Text style={styles.price}>+{formatVND(extra.price)}
            <Text style={styles.duration}>{extra.minutes > 0 ? ` · ${extra.minutes} phút${extra.kind === 'SERVICE' ? ' dự kiến' : ''}` : ' · Không thêm thời gian'}</Text>
          </Text>
          {blocked && <Text style={styles.blocked}>Đã có hạng mục tương tự. Bỏ mục đã chọn nếu muốn đổi.</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${isSelected ? 'Bỏ' : 'Thêm'} ${extra.name}`}
            accessibilityState={{ disabled: blocked, selected: isSelected }}
            disabled={blocked}
            onPress={() => onToggle(extra.key)}
            style={[styles.addButton, isSelected && styles.removeButton, blocked && styles.disabledButton]}>
            <Text style={[styles.addText, isSelected && styles.removeText]}>
              {isSelected ? '✓ Đã thêm · Bỏ' : blocked ? 'Trùng hạng mục' : '+ Thêm'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View>
      <View style={styles.heading}>
        <Text style={styles.title}>Gợi ý phù hợp với bạn</Text>
        <Text style={styles.previewBadge}>Xem thử</Text>
      </View>
      <Text style={styles.subtitle}>Chọn nhanh việc cần làm thêm. Không bắt buộc.</Text>
      {suggested.length ? suggested.map(extra => renderCard(extra)) : (
        <Text style={styles.empty}>Chưa có gợi ý phù hợp. Bạn có thể tiếp tục với dịch vụ chính.</Text>
      )}
      {options.some(e => e.kind === 'SERVICE') && (
        <Text style={styles.notice}>Dịch vụ liên quan có thể cần nhân viên hoặc lịch riêng. Giá và thời gian ở đây là dữ liệu mẫu.</Text>
      )}
      {options.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => setShowAll(true)} style={styles.seeAll}>
          <Text style={styles.seeAllText}>Xem tất cả dịch vụ thêm ({options.length}) ›</Text>
        </Pressable>
      )}
      {selected.length > 0 && (
        <View style={styles.chosenSection}>
          <Text style={styles.title}>Đã chọn thêm ({selected.length})</Text>
          {selected.map(extra => (
            <View key={extra.key} style={styles.chosenRow}>
              <View style={styles.info}>
                <Text style={styles.name}>{extra.name}</Text>
                <Text style={styles.scope}>+{formatVND(extra.price)}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ ${extra.name}`}
                onPress={() => onToggle(extra.key)} style={styles.closeButton}>
                <Text style={styles.seeAllText}>Bỏ</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Chi phí chọn thêm</Text>
            <Text style={styles.totalPrice}>+{formatVND(addOnsTotal + servicesTotal)}</Text>
          </View>
          {addOnMinutes > 0 && <Text style={styles.notice}>Add-on thêm khoảng {addOnMinutes} phút. Chưa tính lịch riêng của dịch vụ liên quan.</Text>}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Không chọn thêm dịch vụ"
        accessibilityState={{ selected: selected.length === 0 }}
        onPress={onClear}
        style={[styles.skip, selected.length === 0 && styles.selectedCard]}>
        <Text style={styles.skipIcon}>{selected.length === 0 ? '✓' : '−'}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>Không chọn thêm dịch vụ</Text>
          <Text style={styles.scope}>Chỉ dùng dịch vụ chính, không phát sinh phí chọn thêm.</Text>
        </View>
      </Pressable>
      <Modal visible={showAll} transparent animationType="slide" onRequestClose={() => setShowAll(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng danh sách dịch vụ thêm" style={styles.backdropTap} onPress={() => setShowAll(false)} />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Text style={styles.title}>Tất cả dịch vụ thêm</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Đóng danh sách" onPress={() => setShowAll(false)} style={styles.closeButton}>
                <Text style={styles.seeAllText}>Đóng ✕</Text>
              </Pressable>
            </View>
            <View style={styles.filters}>
              {(['ALL', 'ADD_ON', 'SERVICE'] as const).map(kind => (
                <Pressable key={kind} accessibilityRole="button" accessibilityState={{ selected: filter === kind }}
                  onPress={() => setFilter(kind)} style={[styles.filter, filter === kind && styles.activeFilter]}>
                  <Text style={filter === kind ? styles.activeFilterText : styles.filterText}>
                    {kind === 'ALL' ? 'Tất cả' : kind === 'ADD_ON' ? 'Add-on' : 'Dịch vụ liên quan'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              {options.filter(e => filter === 'ALL' || e.kind === filter).map(extra => renderCard(extra))}
              {!options.some(e => filter === 'ALL' || e.kind === filter) && <Text style={styles.empty}>Chưa có lựa chọn trong nhóm này.</Text>}
            </ScrollView>
            <View style={styles.sheetFooter}>
              <Text style={styles.totalLabel}>Đã thêm {selected.length} mục · +{formatVND(addOnsTotal + servicesTotal)}</Text>
              <Pressable accessibilityRole="button" onPress={() => setShowAll(false)} style={styles.doneButton}>
                <Text style={styles.doneText}>Xong · Quay lại đặt dịch vụ</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  title: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: BrandColors.gray900 },
  previewBadge: { fontSize: 10, color: BrandColors.primaryDark, backgroundColor: BrandColors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  subtitle: { fontSize: 13, color: BrandColors.gray600, marginBottom: 16 },
  card: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: BrandColors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  selectedCard: { borderColor: BrandColors.primary, backgroundColor: BrandColors.primaryLight },
  image: { width: 60, height: 60, borderRadius: BorderRadius.md, backgroundColor: BrandColors.gray100 },
  info: { flex: 1, minWidth: 0 },
  kind: { fontSize: 10, fontWeight: '600', color: BrandColors.primaryDark, marginBottom: 3 },
  name: { fontSize: 13, fontWeight: '700', color: BrandColors.gray900 },
  scope: { fontSize: 11, color: BrandColors.gray600, marginTop: 4 },
  reason: { fontSize: 12, color: BrandColors.gray600, lineHeight: 17, marginTop: 4 },
  price: { fontSize: 13, fontWeight: '700', color: BrandColors.primaryDark, marginTop: 6 },
  duration: { fontSize: 11, fontWeight: '400', color: BrandColors.gray600 },
  addButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: BrandColors.primary, borderRadius: BorderRadius.lg, marginTop: 8 },
  addText: { fontSize: 12, fontWeight: '700', color: BrandColors.white },
  removeButton: { backgroundColor: BrandColors.white, borderWidth: 1, borderColor: BrandColors.primary },
  removeText: { color: BrandColors.primaryDark },
  disabledButton: { backgroundColor: BrandColors.gray400 },
  blocked: { fontSize: 11, color: BrandColors.gray600, marginTop: 6 },
  notice: { fontSize: 11, color: BrandColors.gray600, lineHeight: 17, marginVertical: 6 },
  seeAll: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BrandColors.primary, borderRadius: BorderRadius.lg, marginTop: 8 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: BrandColors.primaryDark },
  chosenSection: { marginTop: Spacing.four, gap: 8 },
  chosenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.lg, backgroundColor: BrandColors.white },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  totalLabel: { flexShrink: 1, fontSize: 12, color: BrandColors.gray600 },
  totalPrice: { fontSize: 13, fontWeight: '700', color: BrandColors.primaryDark },
  skip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 16, backgroundColor: BrandColors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: '#E2E8F0' },
  skipIcon: { fontSize: 20, color: BrandColors.primaryDark },
  empty: { fontSize: 13, color: BrandColors.gray600, lineHeight: 20, paddingVertical: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.35)' },
  backdropTap: { flex: 1 },
  sheet: { maxHeight: '85%', backgroundColor: BrandColors.gray50, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  closeButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  filter: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: BorderRadius.full, backgroundColor: BrandColors.white, borderWidth: 1, borderColor: BrandColors.gray200 },
  activeFilter: { backgroundColor: BrandColors.primaryLight, borderColor: BrandColors.primary },
  filterText: { fontSize: 12, color: BrandColors.gray600 },
  activeFilterText: { fontSize: 12, fontWeight: '700', color: BrandColors.primaryDark },
  sheetScroll: { flexShrink: 1 },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 16 },
  sheetFooter: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: BrandColors.gray200, backgroundColor: BrandColors.white },
  doneButton: { backgroundColor: BrandColors.primary, borderRadius: BorderRadius.lg, padding: 14, alignItems: 'center' },
  doneText: { color: BrandColors.white, fontSize: 13, fontWeight: '700' },
});
