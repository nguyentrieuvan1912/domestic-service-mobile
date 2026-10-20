import { VoucherTicket } from '@/components/common/VoucherTicket';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { formatVND } from '@/components/common/Badge';
import type { Promotion } from '@/types/service';
import { promotionIssue } from '@/utils/promotion-eligibility';

type Props = {
  promotions: Promotion[]; services: readonly { id: string; name: string }[]; serviceId: string; amount: number;
  input: string; changeInput: (value: string) => void; selectedCode: string; applied: boolean; busy: boolean;
  feedback: string; failures: Record<string, string>; apply: (code: string) => void; clear: () => void;
};
export function BookingPromotions(props: Props) {
  const { width } = useWindowDimensions();
  const ticketWidth = Math.min(340, Math.max(270, width - 64));
  const [detail, setDetail] = useState<Promotion | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (props.applied && !props.busy) setExpanded(false);
  }, [props.applied, props.busy, props.selectedCode]);
  const reason = (p: Promotion) => promotionIssue(p, props.serviceId, props.amount) || props.failures[p.code] || '';
  return <View style={styles.section}>
    <View style={styles.row}><IconSymbol name="ticket" size={20} color={BrandColors.primary} /><Text style={styles.heading}>Ưu đãi / Mã giảm giá</Text></View>
    {props.applied && <View style={styles.selected}><View style={styles.selectedLabel}><IconSymbol name="ticket" size={18} color={BrandColors.primaryDark} /><Text style={styles.success}>Đang áp dụng {props.selectedCode}</Text></View><Pressable accessibilityRole="button" onPress={props.clear} hitSlop={8}><Text style={styles.link}>Bỏ mã</Text></Pressable></View>}
    {!expanded && <Pressable accessibilityRole="button" accessibilityState={{ expanded: false }} onPress={() => setExpanded(true)} style={styles.open}><Text style={styles.link}>{props.applied ? 'Thay đổi mã giảm giá' : 'Áp dụng mã giảm giá'}</Text><IconSymbol name="chevronDown" size={18} color={BrandColors.primaryDark} /></Pressable>}
    {expanded && <>
    <View style={styles.row}><TextInput accessibilityLabel="Nhập mã ưu đãi" placeholder="Nhập mã ưu đãi..." value={props.input} onChangeText={props.changeInput} autoCapitalize="characters" style={styles.input} /><Pressable accessibilityRole="button" disabled={props.busy} onPress={() => props.apply(props.input)} style={styles.apply}><Text style={styles.white}>{props.busy ? 'Đang kiểm tra…' : 'Áp dụng'}</Text></Pressable></View>
    {!!props.feedback && <Text accessibilityRole="alert" style={styles.error}>{props.feedback}</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {props.promotions.map(p => {
        const issue = reason(p), selected = props.applied && props.selectedCode === p.code;
        return <View key={p.id} style={{ width: ticketWidth }}>
          <VoucherTicket promotion={p} selected={selected} busy={props.busy} issue={issue}
            onDetail={() => setDetail(p)} onPress={() => issue ? setDetail(p) : selected ? props.clear() : props.apply(p.code)} />
        </View>;
      })}
    </ScrollView>
    <Pressable accessibilityRole="button" accessibilityLabel="Thu gọn mã giảm giá" accessibilityState={{ expanded: true }} onPress={() => setExpanded(false)} style={styles.collapse} hitSlop={6}><View style={styles.up}><IconSymbol name="chevronDown" size={18} color={BrandColors.primaryDark} /></View></Pressable>
    </>}
    <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
      <View style={styles.scrim}><View style={styles.modal} accessibilityViewIsModal>
        <View style={styles.row}><Text style={styles.heading}>{detail?.code}</Text><Pressable accessibilityRole="button" accessibilityLabel="Đóng chi tiết mã" onPress={() => setDetail(null)} hitSlop={10}><IconSymbol name="close" size={20} /></Pressable></View>
        <ScrollView><Text style={styles.heading}>{detail?.name}</Text><Text style={styles.detail}>{detail?.description}</Text>
          {detail && <>
            <Text style={reason(detail) ? styles.error : styles.success}>{reason(detail) || 'Mã phù hợp với dịch vụ và giá trị đơn hiện tại. Hệ thống sẽ kiểm tra lại khi áp dụng và đặt đơn.'}</Text>
            <Text style={styles.detail}>Mức giảm: {detail.discountType === 'PERCENTAGE' ? `${detail.discountValue}% tổng hóa đơn` : formatVND(detail.discountValue)}. {detail.maxDiscountAmount != null ? `Giảm tối đa ${formatVND(detail.maxDiscountAmount)}.` : 'Không giới hạn số tiền giảm.'}</Text>
            <Text style={styles.detail}>Dịch vụ áp dụng: {detail.serviceIds?.length ? detail.serviceIds.map(id => props.services.find(s => s.id === String(id))?.name || `Dịch vụ #${id}`).join(', ') : 'Tất cả dịch vụ'}.</Text>
            <Text style={styles.detail}>Giá trị đơn tối thiểu: {formatVND(detail.minimumBookingAmount)}.</Text>
            <Text style={styles.detail}>Hiệu lực: {new Date(detail.startDate).toLocaleString('vi-VN')} – {new Date(detail.endDate).toLocaleString('vi-VN')}.</Text>
            <Text style={styles.detail}>Lượt còn lại: {detail.usageLimit == null ? 'Không giới hạn' : Math.max(0, detail.usageLimit - detail.usedCount)}.</Text>
            <Text style={styles.detail}>Mỗi đơn áp dụng một mã. Phạm vi dịch vụ xét theo dịch vụ chính của đơn.</Text>
          </>}
        </ScrollView>
        <Pressable accessibilityRole="button" style={styles.apply} onPress={() => { if (detail && !promotionIssue(detail,props.serviceId,props.amount)) props.apply(detail.code); setDetail(null); }}><Text style={styles.white}>{detail && !promotionIssue(detail,props.serviceId,props.amount) ? reason(detail) ? 'Kiểm tra và thử lại' : 'Áp dụng mã này' : 'Đã hiểu'}</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 12, marginVertical: 16 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  open: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderColor: '#9FE5CF', borderRadius: 12, backgroundColor: '#F0FDF8', padding: 14 },
  selected: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#DDF8ED' },
  selectedLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  collapse: { alignItems: 'center', justifyContent: 'center', minHeight: 32, alignSelf: 'center', width: 64, borderRadius: 16, backgroundColor: '#E3F8EF' },
  up: { transform: [{ rotate: '180deg' }] },
  heading: { fontWeight: '700', fontSize: 16, color: BrandColors.gray900 }, input: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#DCE5E8', padding: 12, borderRadius: 10, backgroundColor: '#fff' },
  apply: { backgroundColor: BrandColors.primary, padding: 12, borderRadius: 10, alignItems: 'center' }, white: { color: '#fff', fontWeight: '700' },
  list: { gap: 12, paddingVertical: 2 }, link: { fontSize: 12, fontWeight: '700', color: BrandColors.primaryDark },
  error: { color: '#B91C1C', fontSize: 13, lineHeight: 19 }, success: { color: BrandColors.primaryDark, fontSize: 13, lineHeight: 19 },
  scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 24 }, modal: { alignSelf: 'center', width: '100%', maxWidth: 460, maxHeight: '85%', backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 16 }, detail: { fontSize: 14, lineHeight: 22, color: BrandColors.gray700, marginVertical: 7 },
});
