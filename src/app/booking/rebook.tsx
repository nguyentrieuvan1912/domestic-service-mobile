import { ServiceQuestions } from '@/components/booking/ServiceQuestions';
import { serviceAnswersIssue } from '@/utils/service-requirements';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings, bookingView, type ConnectedBooking } from '@/data/connectedBookings';
import { operationRequest } from '@/api/operations';
import { catalogGet } from '@/api/catalog';
import type { CatalogDetail } from '@/api/catalog-types';
import { BookingExitButton } from '@/components/booking/BookingExitButton';
import { formatVND } from '@/components/common/Badge';
import { useQuickRebook } from '@/hooks/use-quick-rebook';
import { rebookTimes } from '@/utils/quick-rebook';
import type { CustomerAddress } from '@/types/user';

type Resource = { key: string; booking?: ConnectedBooking; detail?: CatalogDetail; address?: CustomerAddress; error?: string };
export default function QuickRebookScreen() {
  const { sourceId, replaceStaff } = useLocalSearchParams<{ sourceId?: string; replaceStaff?: string }>();
  const { currentCustomer, accessToken } = useAuth();
  const owner = currentCustomer?.id;
  const [attempt, setAttempt] = useState(0), [resource, setResource] = useState<Resource>({ key: '' });
  const key = `${owner}:${sourceId}`;
  useFocusEffect(useCallback(() => {
    if (!owner || !sourceId || !/^\d+$/.test(sourceId)) { setResource({ key, error: 'Vui lòng đăng nhập và chọn một đơn hợp lệ.' }); return; }
    const controller = new AbortController();
    void (async () => {
      const booking = await CustomerBookings.detail(sourceId, controller.signal);
      if (booking.customerId !== owner) throw new Error('Đơn hàng không thuộc tài khoản này.');
      const [detail, address] = await Promise.all([
        catalogGet<CatalogDetail>('/services/' + booking.serviceId, controller.signal),
        operationRequest<CustomerAddress>('identity', '/customer/addresses/' + booking.addressId, 'GET', undefined, controller.signal),
      ]);
      if (!detail.packages.some(pack => String(pack.id) === booking.packageId)) throw new Error('Gói cũ không còn được cung cấp. Vui lòng chọn dịch vụ mới.');
      if (!controller.signal.aborted) setResource({ key, booking, detail, address });
    })().catch(error => { if (!controller.signal.aborted) setResource({ key, error: error.message }); });
    return () => controller.abort();
  }, [key, accessToken, attempt]));
  const data = resource.key === key ? resource : undefined;
  if (!data?.booking || !data.detail || !data.address) return <SafeAreaView style={s.screen}>
    <View style={s.header}><Text style={s.heading}>Đặt lại nhanh</Text><BookingExitButton /></View>
    <View style={s.center}>{data?.error ? <><Text style={s.error}>{data.error}</Text><Pressable onPress={() => setAttempt(value => value + 1)}><Text style={s.link}>Thử lại</Text></Pressable></> : <ActivityIndicator color="#00875F" />}</View>
  </SafeAreaView>;
  return <RebookContent key={key} source={data.booking} detail={data.detail} address={data.address} replaceStaff={replaceStaff === '1' || ['NO_STAFF_FOUND', 'REJECTED'].includes(data.booking.status)} />;
}
function RebookContent({ source, detail, address, replaceStaff }: { source: ConnectedBooking; detail: CatalogDetail; address: CustomerAddress; replaceStaff: boolean }) {
  const router = useRouter();
  const form = useQuickRebook(source, replaceStaff, detail.requirements);
  const [extrasOpen, setExtrasOpen] = useState(false), [customOpen, setCustomOpen] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  const scroll = useRef<ScrollView>(null), repairOffset = useRef(0);
  const [promoInput, setPromoInput] = useState(form.promotionCode);
  const [promoFeedback, setPromoFeedback] = useState('');
  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoFeedback('Vui lòng nhập mã khuyến mãi.'); return; }
    setPromoFeedback(''); setError(''); setPromoInput(code); form.setPromotionCode(code); form.retry();
  };
  const [editingAnswers, setEditingAnswers] = useState(false);
  const [requiredRepairs] = useState(() => detail.requirements.filter(field => !!serviceAnswersIssue([field], form.answers)));
  const presetTimes = rebookTimes(form.quote?.durationMinutes || form.draft.durationMinutes);
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const dates = Array.from({ length: 7 }, (_, day) => new Date(Date.parse(today + 'T12:00:00Z') + day * 86400000).toISOString().slice(0, 10));
  const [customDate, setCustomDate] = useState(form.startsAt.slice(0, 10) || dates[1]);
  const times = Array.from({ length: 24 }, (_, slot) => `${String(8 + Math.floor(slot / 2)).padStart(2, '0')}:${slot % 2 ? '30' : '00'}`);
  const pack = detail.packages.find(item => String(item.id) === source.packageId)!;
  const related = (source.service as Record<string, unknown>).relatedServices;
  const keptAddons = form.addOnIds.map(id => detail.addOns.find(item => String(item.id) === id)?.name || source.addOns.find(item => item.addOnId === id)?.addOnName || 'Dịch vụ bổ sung #' + id);
  const confirm = async () => {
    if (busy.current || !form.ready) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const raw = await form.submit();
      const saved = bookingView(raw);
      void CustomerBookings.load().catch(() => {});
      router.replace(saved.mode === 'MODE_A' ? { pathname: '/booking/waiting', params: { id: saved.id } } : { pathname: '/booking/[id]', params: { id: saved.id } });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Chưa đặt lại được dịch vụ.';
      setError(message);
      form.retry();
    } finally { busy.current = false; setSaving(false); }
  };
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.heading}>Đặt lại nhanh</Text><Text style={s.small}>Chọn giờ, nhân viên rồi xác nhận</Text></View><BookingExitButton disabled={saving} /></View>
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      <View style={s.card}><Text style={s.title}>{detail.service.name}</Text><Text style={s.body}>{pack.name} × {form.draft.quantity} • {source.requiredStaffCount} nhân viên</Text>
        <Text style={s.small}>Giữ thông tin từ đơn {source.bookingCode}</Text>
        {Object.entries({ ...form.draft.configuration, ...form.answers }).map(([field, value]) => <Text key={field} style={s.body}>{source.service.answerLabels?.[field] || source.service.configurationLabels?.[field] || field}: {Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? value ? 'Có' : 'Không' : String(value)}</Text>)}
        {Array.isArray(related) && related.map((item: { id: number; name: string }) => <Text key={item.id} style={s.body}>Dịch vụ kèm theo: {item.name}</Text>)}
        {!!source.notes && <Text style={s.body}>Ghi chú: {source.notes}</Text>}
        <Text style={s.body}>{address.fullAddress || [address.streetAddress, address.ward, address.city].filter(Boolean).join(', ')}</Text>
      </View>
      {detail.requirements.length > 0 && <View style={s.card} onLayout={event => { repairOffset.current = event.nativeEvent.layout.y; }}>
        <View style={s.row}><Text style={s.title}>{requiredRepairs.length ? 'Bổ sung thông tin từ đơn cũ' : 'Thông tin dịch vụ'}</Text><Pressable disabled={saving} onPress={() => setEditingAnswers(value => !value)}><Text style={s.link}>{editingAnswers ? 'Thu gọn' : 'Chỉnh sửa'}</Text></Pressable></View>
        {requiredRepairs.length > 0 && <Text style={s.small}>Đơn cũ chưa lưu đủ thông tin theo yêu cầu hiện tại. Chỉ cần bổ sung các mục bên dưới để tiếp tục đặt lại.</Text>}
        <View pointerEvents={saving ? 'none' : 'auto'}><ServiceQuestions fields={editingAnswers ? detail.requirements : requiredRepairs} values={form.answers} change={form.setAnswers} /></View>
        {!!form.answersIssue && <Text accessibilityRole="alert" style={s.error}>{form.answersIssue}</Text>}
      </View>}
      <View style={s.card}><Text style={s.title}>1. Khi nào bạn cần?</Text>
        {presetTimes.map(slot => <Pressable disabled={saving} key={slot.startsAt} onPress={() => form.setStartsAt(slot.startsAt)} style={[s.option, form.startsAt === slot.startsAt && s.selected]}><Text style={s.body}>{slot.label} {form.startsAt === slot.startsAt ? '✓' : ''}</Text></Pressable>)}
        <Pressable disabled={saving} style={s.option} onPress={() => setCustomOpen(true)}><Text style={s.link}>Khác • Chọn ngày và giờ tùy ý</Text></Pressable>
        <Text style={s.body}>Đã chọn: {new Date(form.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</Text>
        {!!form.timeIssue && <Text style={s.error}>{form.timeIssue}</Text>}
      </View>
      <View style={s.card}><Text style={s.title}>2. Ai sẽ thực hiện?</Text>
        {source.requiredStaffCount === 1 ? <>
          <Pressable disabled={saving || replaceStaff || !form.draft.previousStaffId} onPress={() => form.setMode('KEEP')} style={[s.option, form.mode === 'KEEP' && s.selected, (replaceStaff || !form.draft.previousStaffId) && s.disabled]}><Text style={s.body}>Giữ nhân viên cũ • {form.draft.previousStaffName}</Text></Pressable>
          <Pressable disabled={saving} onPress={() => form.setMode('CHOOSE')} style={[s.option, form.mode === 'CHOOSE' && s.selected]}><Text style={s.body}>Tôi chọn nhân viên khác</Text></Pressable>
        </> : <Text style={s.small}>Gói cần {source.requiredStaffCount} nhân viên. Hệ thống sẽ tìm đủ đội ngũ phù hợp.</Text>}
        <Pressable disabled={saving} onPress={() => form.setMode('AUTO')} style={[s.option, form.mode === 'AUTO' && s.selected]}><Text style={s.body}>Để hệ thống ghép nhân viên phù hợp</Text></Pressable>
        {replaceStaff && <Text style={s.error}>Nhân viên trước chưa nhận lịch. Chọn người khác hoặc để hệ thống ghép; dịch vụ cũ vẫn được giữ.</Text>}
        {form.mode !== 'AUTO' && (!form.quote ? <Text style={s.small}>{form.answersIssue ? 'Bổ sung thông tin dịch vụ ở trên để kiểm tra lịch nhân viên.' : form.quoteError ? 'Chưa kiểm tra được lịch do chưa có báo giá hợp lệ.' : 'Đang kiểm tra thời lượng dịch vụ…'}</Text> : form.staffError ? <Pressable onPress={form.retry}><Text style={s.error}>{form.staffError} • Thử lại</Text></Pressable> : !form.candidates ? <ActivityIndicator color="#00875F" /> : form.mode === 'KEEP' ? <Text style={form.staffAvailable ? s.link : s.error}>{form.staffAvailable ? 'Nhân viên cũ phù hợp giờ đã chọn.' : 'Nhân viên cũ không rảnh hoặc không đáp ứng lịch đã chọn. Vui lòng chọn nhân viên khác hoặc để hệ thống ghép.'}</Text> : <>
          {form.candidates.length === 0 && <Text style={s.small}>Chưa có nhân viên phù hợp. Bạn có thể đổi giờ hoặc để hệ thống ghép.</Text>}
          {form.candidates.filter(person => String(person.id) !== form.draft.previousStaffId).map(person => <Pressable disabled={saving} key={String(person.id)} style={[s.option, form.staffId === String(person.id) && s.selected]} onPress={() => form.setStaffId(String(person.id))}><Text style={s.body}>{String(person.fullName)} {form.staffId === String(person.id) ? '✓' : ''}</Text></Pressable>)}
        </>)}
        {form.mode !== 'AUTO' && <Text style={s.small}>Nhân viên có tối đa 5 phút để nhận lịch. Hết giờ, bạn có thể chọn lại hoặc để hệ thống ghép.</Text>}
      </View>
      <View style={s.card}><View style={s.row}><Text style={s.title}>3. Dịch vụ bổ sung</Text><Pressable disabled={saving} onPress={() => setExtrasOpen(value => !value)}><Text style={s.link}>{extrasOpen ? 'Thu gọn' : '+ Thêm addon'}</Text></Pressable></View>
        {keptAddons.length ? keptAddons.map((name, index) => <Text key={index} style={s.body}>• {name}</Text>) : <Text style={s.small}>Chưa chọn dịch vụ bổ sung.</Text>}
        {extrasOpen && detail.addOns.map(add => { const id = String(add.id), selected = form.addOnIds.includes(id); return <Pressable disabled={saving} key={id} style={[s.option, selected && s.selected]} onPress={() => form.setAddOnIds(selected ? form.addOnIds.filter(value => value !== id) : [...form.addOnIds, id])}><Text style={s.body}>{selected ? '✓ ' : '+ '}{add.name} • {formatVND(add.price)} • +{add.extraDurationMinutes} phút</Text></Pressable>; })}
        {extrasOpen && detail.addOns.length === 0 && <Text style={s.small}>Dịch vụ này chưa có addon.</Text>}
      </View>
      <View style={s.card}><Text style={s.title}>4. Mã khuyến mãi</Text>
        <View style={s.row}><TextInput accessibilityLabel="Mã khuyến mãi đặt lại" editable={!saving} autoCapitalize="characters" autoCorrect={false} maxLength={64} value={promoInput} onChangeText={value => { setPromoInput(value); setPromoFeedback(''); }} placeholder="Nhập mã khuyến mãi" style={s.promoInput} /><Pressable accessibilityRole="button" disabled={saving || !promoInput.trim()} onPress={applyPromo} style={[s.promoApply, (saving || !promoInput.trim()) && s.disabled]}><Text style={s.white}>Áp dụng</Text></Pressable></View>
        {!!promoFeedback && <Text accessibilityRole="alert" style={s.error}>{promoFeedback}</Text>}
        {!!form.promotionCode && <View style={s.row}><Text style={s.body}>{form.quote ? 'Đang áp dụng' : 'Mã đang kiểm tra'}: {form.promotionCode}</Text><Pressable accessibilityRole="button" disabled={saving} onPress={() => { form.setPromotionCode(''); setPromoInput(''); setPromoFeedback(''); }}><Text style={s.link}>Bỏ mã</Text></Pressable></View>}
        <Text style={s.small}>Mã được kiểm tra lại theo dịch vụ, addon, thời hạn và lượt sử dụng hiện tại.</Text>
      </View>
      <View style={s.card}><Text style={s.title}>5. Thanh toán</Text>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: form.paymentMethod === 'CASH', disabled: saving }} disabled={saving} onPress={() => { setError(''); form.setPaymentMethod('CASH'); }} style={[s.option, form.paymentMethod === 'CASH' && s.selected]}><Text style={s.body}>Tiền mặt {form.paymentMethod === 'CASH' ? '✓' : ''}</Text><Text style={s.small}>Thanh toán cho nhân viên sau khi hoàn thành dịch vụ.</Text></Pressable>
        <View accessibilityLabel="Chuyển khoản hoặc QR chưa được cấu hình" style={[s.option, s.disabled]}><Text style={s.body}>Chuyển khoản / QR • Chưa hỗ trợ</Text><Text style={s.small}>Hệ thống chưa cấu hình thanh toán online.</Text></View>
        {!!form.paymentIssue && <Text accessibilityRole="alert" style={s.error}>{form.paymentIssue}</Text>}
      </View>
      <View style={s.card}><Text style={s.title}>6. Kiểm tra tổng tiền</Text>
        {form.answersIssue ? <Pressable accessibilityRole="button" onPress={() => scroll.current?.scrollTo({ y: repairOffset.current, animated: true })}><Text style={s.error}>Bổ sung thông tin dịch vụ để lấy báo giá ↑</Text></Pressable> : form.quote ? <><View style={s.amountRow}><Text style={s.amountLabel}>Dịch vụ</Text><Text style={s.amountValue}>{formatVND(form.quote.baseAmount)}</Text></View><View style={s.amountRow}><Text style={s.amountLabel}>Bổ sung</Text><Text style={s.amountValue}>{formatVND(form.quote.addOnAmount)}</Text></View>{form.quote.discountAmount > 0 && <View style={s.amountRow}><Text style={s.amountLabel}>Khuyến mãi</Text><Text style={s.amountValue}>−{formatVND(form.quote.discountAmount)}</Text></View>}<View style={[s.amountRow, s.totalRow]}><Text style={s.title}>Tổng thanh toán</Text><Text style={s.total}>{formatVND(form.quote.totalAmount)}</Text></View><Text style={s.small}>Thời lượng: {form.quote.durationMinutes} phút • Giá hiện tại từ hệ thống</Text></> : form.quoteError ? <Pressable onPress={form.retry}><Text style={s.error}>{form.quoteError} • Kiểm tra lại</Text></Pressable> : <ActivityIndicator color="#00875F" />}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </ScrollView>
    <View style={s.footer}><Pressable accessibilityRole="button" disabled={saving || !form.ready} onPress={() => void confirm()} style={[s.primary, (saving || !form.ready) && s.disabled]}><Text style={s.white}>{saving ? 'Đang lưu lịch…' : `Xác nhận đặt lại${form.quote ? ' • ' + formatVND(form.quote.totalAmount) : ''}`}</Text></Pressable></View>
    <Modal visible={customOpen} animationType="slide" onRequestClose={() => setCustomOpen(false)}><SafeAreaView style={s.screen}><View style={s.header}><Text style={s.heading}>Chọn thời gian khác</Text><Pressable onPress={() => setCustomOpen(false)}><Text style={s.link}>Đóng</Text></Pressable></View><ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>Ngày làm việc</Text><View style={s.wrap}>{dates.map(date => <Pressable key={date} style={[s.option, date === customDate && s.selected]} onPress={() => setCustomDate(date)}><Text>{date.slice(8)}/{date.slice(5, 7)}</Text></Pressable>)}</View>
      <Text style={s.title}>Giờ bắt đầu</Text><View style={s.wrap}>{times.map(time => <Pressable key={time} style={s.option} onPress={() => { form.setStartsAt(customDate + 'T' + time + ':00+07:00'); setCustomOpen(false); }}><Text>{time}</Text></Pressable>)}</View><Text style={s.small}>Lịch cần cách hiện tại ít nhất 2 giờ và kết thúc trước 20:00.</Text>
    </ScrollView></SafeAreaView></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3FBF7' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 21, fontWeight: '800', color: '#064E3B' }, content: { padding: 16, gap: 14, paddingBottom: 24 }, card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCE8E2', borderRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#163A2C', flexShrink: 1 }, body: { fontSize: 14, lineHeight: 21, color: '#334155', flexShrink: 1 }, small: { fontSize: 12, lineHeight: 19, color: '#64748B' },
  option: { padding: 13, borderRadius: 11, borderWidth: 1, borderColor: '#DBE5DF', backgroundColor: '#fff' }, selected: { backgroundColor: '#ECFDF5', borderColor: '#00A675' }, disabled: { opacity: 0.45 },
  link: { color: '#00875F', fontWeight: '700', fontSize: 13 }, error: { color: '#B91C1C', lineHeight: 21 }, total: { maxWidth: '55%', textAlign: 'right', fontSize: 20, color: '#00875F', fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }, amountLabel: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 21, color: '#64748B' }, amountValue: { flexShrink: 0, maxWidth: '48%', textAlign: 'right', fontSize: 14, lineHeight: 21, fontWeight: '600', color: '#334155' }, totalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, alignItems: 'center' },
  promoInput: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, color: '#334155', backgroundColor: '#fff' }, promoApply: { padding: 12, borderRadius: 10, backgroundColor: '#00875F' },
  footer: { padding: 14, backgroundColor: '#fff' }, primary: { backgroundColor: '#00875F', padding: 16, borderRadius: 12, alignItems: 'center' }, white: { color: '#fff', fontWeight: '700', fontSize: 15 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
});
