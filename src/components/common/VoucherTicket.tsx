import { useId } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { IconSymbol } from './IconSymbol';
import { formatVND } from './Badge';
import type { Promotion } from '@/types/service';

type Props = {
  promotion: Promotion; selected?: boolean; busy?: boolean; issue?: string;
  onPress?: () => void; onDetail?: () => void; actionLabel?: string;
};

/** The SVG cutouts stay transparent over the page gradient, including on native. */
export function VoucherTicket({ promotion: p, selected = false, busy = false, issue = '', onPress, onDetail, actionLabel }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shape = 'M14 1H76A9 9 0 0 0 94 1H326Q339 1 339 14V202Q339 215 326 215H94A9 9 0 0 0 76 215H14Q1 215 1 202V14Q1 1 14 1Z';
  const percentage = p.discountType === 'PERCENTAGE';
  const value = percentage ? `${p.discountValue}%` : formatVND(p.discountValue);
  return <View style={[styles.ticket, busy && styles.busy]}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 340 216" preserveAspectRatio="none">
        <Defs><ClipPath id={`voucherClip${id}`}><Path d={shape} /></ClipPath>
          <LinearGradient id={`voucherInk${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor={issue ? '#74837D' : '#007C59'} /><Stop offset="1" stopColor={issue ? '#9EADA5' : '#00B681'} />
          </LinearGradient>
        </Defs>
        <G clipPath={`url(#voucherClip${id})`}>
          <Rect width="340" height="216" fill={selected ? '#F1FFF7' : '#FFFFFF'} />
          <Rect width="85" height="216" fill={`url(#voucherInk${id})`} />
          <Circle cx="8" cy="20" r="45" fill="#fff" opacity="0.07" /><Circle cx="76" cy="200" r="44" fill="#fff" opacity="0.09" />
          <Line x1="85" y1="17" x2="85" y2="199" stroke={selected ? '#8AD6B7' : '#D4E6DD'} strokeWidth="1.3" strokeDasharray="3 5" />
        </G>
        <Path d={shape} fill="none" stroke={selected ? '#00A674' : '#C8DFD3'} strokeWidth={selected ? 2 : 1.2} />
      </Svg>
    </View>
    <Pressable accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={`${selected ? 'Bỏ' : 'Chọn'} mã ${p.code}`}
    accessibilityHint={issue ? 'Xem điều kiện và lý do mã chưa áp dụng được cho đơn này.' : 'Chạm vào thẻ để chọn mã giảm giá. Nút xem chi tiết mở điều kiện áp dụng.'}
    accessibilityState={{ selected, disabled: busy || !onPress }} disabled={busy || !onPress} onPress={onPress}
    style={({ pressed }) => [styles.surface, pressed && styles.pressed]}>

      <View pointerEvents="none" style={styles.visual}>
    <View pointerEvents="none" style={styles.stub}>
      <IconSymbol name="ticket" size={24} color="#FFFFFF" />
      <Text style={styles.overline}>GIẢM</Text>
      <Text style={[styles.value, !percentage && styles.fixedValue]} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
      <View style={styles.stubRule} /><Text style={styles.stubLabel}>VOUCHER</Text>
    </View>
    <View style={styles.body}>
      <View style={styles.header}><Text style={styles.code} numberOfLines={1}>{p.code}</Text>
        <View style={[styles.radio, selected && styles.checked]}>{selected && <IconSymbol name="check" size={13} color="#fff" />}</View>
      </View>
      <Text style={styles.name} numberOfLines={2}>{p.name || p.description}</Text>
      <View pointerEvents="none" style={styles.terms}>
        <Text style={styles.scope} numberOfLines={1}>{p.serviceIds?.length ? `Áp dụng ${p.serviceIds.length} dịch vụ` : 'Tất cả dịch vụ'}</Text>
        <Text style={styles.meta} numberOfLines={1}>{p.minimumBookingAmount > 0 ? `Đơn từ ${formatVND(p.minimumBookingAmount)}` : 'Không yêu cầu đơn tối thiểu'}</Text>
        <Text style={styles.meta}>HSD: {new Date(p.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
      </View>
      {!!issue && <Text style={styles.issue} numberOfLines={2}>{issue}</Text>}
      <View style={styles.footer}>
        {onDetail && <View style={styles.detailSpace} />}
        <Text style={[styles.action, !!issue && styles.unavailable]}>{selected ? 'Đã chọn' : actionLabel || (issue ? 'Xem điều kiện' : 'Chạm để chọn')}</Text>
      </View>
    </View>
      </View>
    </Pressable>
    {onDetail && <Pressable accessibilityRole="button" accessibilityLabel={`Xem chi tiết mã ${p.code}`} hitSlop={6}
      onPress={event => { event.stopPropagation(); onDetail(); }} style={[styles.detail, styles.detailOverlay]}>
      <Text style={styles.detailText}>Xem chi tiết</Text><IconSymbol name="chevronRight" size={12} color="#00845E" />
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  ticket: { height: 216, width: '100%' }, surface: { flex: 1 }, visual: { flex: 1, flexDirection: 'row' }, pressed: { opacity: 0.84 }, busy: { opacity: 0.65 },
  stub: { width: '25%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, gap: 7 },
  overline: { color: '#D6FFEC', fontSize: 10, fontWeight: '700', letterSpacing: 2.2 },
  value: { color: '#fff', fontSize: 25, fontWeight: '900', letterSpacing: -0.8 }, fixedValue: { fontSize: 17 },
  stubRule: { width: 22, height: 1, backgroundColor: '#FFFFFF60', marginTop: 4 },
  stubLabel: { color: '#DDFFF0', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  body: { flex: 1, padding: 14, gap: 6 }, header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  code: { flex: 1, fontSize: 15, fontWeight: '800', letterSpacing: 0.8, color: '#123D2E' },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.3, borderColor: '#C6D8CF', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#009E70', borderColor: '#009E70' },
  name: { color: '#243E34', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  terms: { gap: 2 }, scope: { color: '#00845E', fontSize: 11, lineHeight: 16, fontWeight: '600' }, meta: { color: '#6B7D73', fontSize: 10, lineHeight: 15 },
  issue: { color: '#A45D17', fontSize: 10, lineHeight: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 'auto', paddingTop: 4 },
  detailSpace: { width: 80, height: 24 }, detailOverlay: { position: 'absolute', left: '25%', marginLeft: 14, bottom: 14, zIndex: 1 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 24 }, detailText: { color: '#00845E', fontWeight: '700', fontSize: 10 },
  action: { color: '#00845E', fontSize: 10, fontWeight: '700' }, unavailable: { color: '#A45D17' },
});
