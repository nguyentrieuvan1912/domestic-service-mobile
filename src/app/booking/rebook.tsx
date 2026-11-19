import { ServiceQuantity, ServiceQuestions } from '@/components/booking/ServiceQuestions';
import { BookingPromotions } from '@/components/booking/BookingPromotions';
import { WalletBalancePreview } from '@/components/booking/WalletBalancePreview';
import { AppBackground } from '@/components/common/AppBackground';
import { IconSymbol } from '@/components/common/IconSymbol';
import { serviceAnswersIssue } from '@/utils/service-requirements';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings, bookingView, type ConnectedBooking } from '@/data/connectedBookings';
import { catalogGet } from '@/api/catalog';
import { loadCatalogServices } from '@/api/booking-catalog';
import type { CatalogDetail } from '@/api/catalog-types';
import type { Promotion } from '@/types/service';
import { BookingExitButton } from '@/components/booking/BookingExitButton';
import { formatVND } from '@/components/common/Badge';
import { useQuickRebook } from '@/hooks/use-quick-rebook';
import { useCustomerAddresses } from '@/hooks/use-customer-addresses';
import { useAppTheme } from '@/context/ThemeContext';
import { BOOKING_PAYMENT_OPTIONS, bookingRequiresPayment } from '@/utils/booking-payment-options';
import { customerSlotIssue } from '@/utils/customer-booking-time';
import { REBOOK_HOURS, rebookDates, rebookStart, rebookTimes } from '@/utils/quick-rebook';
import { promotionIssue } from '@/utils/promotion-eligibility';

type Resource = { key: string; booking?: ConnectedBooking; detail?: CatalogDetail; error?: string };
export default function QuickRebookScreen() {
  const { sourceId, replaceStaff } = useLocalSearchParams<{ sourceId?: string; replaceStaff?: string }>();
  const { currentCustomer, accessToken } = useAuth();
  const owner = currentCustomer?.id;
  const [attempt, setAttempt] = useState(0), [resource, setResource] = useState<Resource>({ key: '' });
  const key = `${owner}:${accessToken}:${sourceId}`;
  useFocusEffect(useCallback(() => {
    if (!owner || !sourceId || !/^\d+$/.test(sourceId)) { setResource({ key, error: 'Vui lòng đăng nhập và chọn một đơn hợp lệ.' }); return; }
    const controller = new AbortController();
    void (async () => {
      const booking = await CustomerBookings.detail(sourceId, controller.signal);
      if (booking.customerId !== owner) throw new Error('Đơn hàng không thuộc tài khoản này.');
      const detail = await catalogGet<CatalogDetail>('/services/' + booking.serviceId, controller.signal);
      if (!controller.signal.aborted) setResource({ key, booking, detail });
    })().catch(error => { if (!controller.signal.aborted) setResource({ key, error: error instanceof Error ? error.message : 'Chưa tải được đơn đặt lại.' }); });
    return () => controller.abort();
  }, [key, accessToken, attempt]));
  const data = resource.key === key ? resource : undefined;
  if (!data?.booking || !data.detail) return <SafeAreaView style={s.screen}>
    <View style={s.header}><Text style={s.heading}>Đặt lại nhanh</Text><BookingExitButton /></View>
    <View style={s.center}>{data?.error ? <><Text style={s.error}>{data.error}</Text><Pressable onPress={() => setAttempt(value => value + 1)}><Text style={s.link}>Thử lại</Text></Pressable></> : <ActivityIndicator color="#00875F" />}</View>
  </SafeAreaView>;
  return <RebookContent key={key} source={data.booking} detail={data.detail} replaceStaff={replaceStaff === '1' || ['NO_STAFF_FOUND', 'REJECTED'].includes(data.booking.status)} />;
}

function PreviousBooking({ source, detail }: { source: ConnectedBooking; detail: CatalogDetail }) {
  const [expanded, setExpanded] = useState(true);
  const saved = source.service;
  const previousAddress = source.address?.fullAddress || source.address?.streetAddress;
  const related = (source.service as Record<string, unknown>).relatedServices;
  const extras = [
    ...source.addOns.map(item => item.quantity > 1 ? `${item.addOnName} × ${item.quantity}` : item.addOnName),
    ...(Array.isArray(related) ? related.map(item => item?.name).filter((name): name is string => typeof name === 'string' && !!name) : []),
  ];
  const date = source.bookingDate?.split('-').reverse().join('/');
  return <View style={s.card}>
    <View style={s.row}>
      <View style={s.fill}><Text style={s.title}>Thông tin đơn cũ</Text><Text style={s.small}>{source.bookingCode}</Text></View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} style={s.smallButton} onPress={() => setExpanded(value => !value)}>
        <Text style={s.link}>{expanded ? 'Thu gọn' : 'Xem chi tiết'}</Text>
      </Pressable>
    </View>
    {expanded && <>
      <View><Text style={s.label}>Dịch vụ và gói đã đặt</Text>
        <Text style={s.body}>{[saved.name || saved.serviceName || detail.service.name, saved.packageName].filter(Boolean).join(' · ')}</Text>
        <Text style={s.small}>Số lượng {String(saved.quantity ?? saved.configuration?.acQuantity ?? 1)} · {source.requiredStaffCount} nhân viên</Text>
      </View>
      {!!date && <View><Text style={s.label}>Lịch lần trước</Text><Text style={s.body}>{date} · {source.startTime?.slice(0, 5)}–{source.endTime?.slice(0, 5)}</Text></View>}
      {!!previousAddress && <View><Text style={s.label}>Địa chỉ lần trước</Text><Text style={s.body}>{previousAddress}</Text></View>}
      {extras.length > 0 && <View><Text style={s.label}>Dịch vụ bổ sung lần trước</Text>{extras.map((name, index) => <Text key={index} style={s.body}>{name}</Text>)}</View>}
      {!!source.notes && <View><Text style={s.label}>Ghi chú đã lưu</Text><Text style={s.body}>{source.notes}</Text></View>}
      {!!source.promotionCode && <View><Text style={s.label}>Mã giảm giá lần trước</Text><Text style={s.body}>{source.promotionCode}</Text></View>}
      <View style={[s.row, s.totalRow]}><Text style={s.label}>Tổng tiền lần trước</Text><Text style={s.title}>{formatVND(source.totalAmount)}</Text></View>
    </>}
  </View>;
}

function RebookContent({ source, detail, replaceStaff }: { source: ConnectedBooking; detail: CatalogDetail; replaceStaff: boolean }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const addresses = useCustomerAddresses();
  const [addressId, setAddressId] = useState(source.addressId);
  const address = addresses.addresses.find(item => item.id === addressId);
  const form = useQuickRebook(source, replaceStaff, detail.requirements, { detail, addressId: address?.id ?? '' });
  const [addressOpen, setAddressOpen] = useState(false), [packageOpen, setPackageOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false), [customOpen, setCustomOpen] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null), repairOffset = useRef(0);
  const [promoInput, setPromoInput] = useState(form.promotionCode);
  const [promotionState, setPromotionState] = useState<{ key: string; feedback: string; failures: Record<string, string> }>({ key: '', feedback: '', failures: {} });
  const [promotionList, setPromotionList] = useState<{ items: Promotion[]; loading: boolean; error: string }>({ items: [], loading: true, error: '' });
  const [services, setServices] = useState([{ id: source.serviceId, name: detail.service.name }]);
  const [promotionAttempt, setPromotionAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setPromotionList(value => ({ ...value, loading: true, error: '' }));
    void catalogGet<Promotion[]>('/promotions', controller.signal).then(items => {
      if (!controller.signal.aborted) setPromotionList({ items, loading: false, error: '' });
    }).catch(() => {
      if (!controller.signal.aborted) setPromotionList(value => ({ ...value, loading: false, error: 'Chưa tải được danh sách mã giảm giá.' }));
    });
    void loadCatalogServices(controller.signal).then(items => {
      if (!controller.signal.aborted) setServices(items.map(item => ({ id: String(item.id), name: item.name })));
    }).catch(() => {});
    return () => controller.abort();
  }, [promotionAttempt]));
  const { pricingContextKey, promotionCode, quote, quoteError, setPromotionCode } = form;
  const failures = promotionState.key === pricingContextKey ? promotionState.failures : {};
  const feedback = promotionState.key === pricingContextKey ? promotionState.feedback : '';
  const amount = quote ? quote.baseAmount + quote.addOnAmount : undefined;
  useEffect(() => {
    if (!promotionCode || !quoteError || !/^(?:Mã ưu đãi|Đơn chưa đạt mức tối thiểu áp dụng ưu đãi|Ưu đãi không áp dụng)/i.test(quoteError)) return;
    setPromotionState(previous => ({
      key: pricingContextKey,
      feedback: quoteError,
      failures: { ...(previous.key === pricingContextKey ? previous.failures : {}), [promotionCode.toUpperCase()]: quoteError },
    }));
    setPromotionCode('');
  }, [pricingContextKey, promotionCode, quoteError, setPromotionCode]);
  const applyPromo = (input: string) => {
    const code = input.trim().toUpperCase();
    const promotion = promotionList.items.find(item => item.code.toUpperCase() === code);
    const issue = !code ? 'Vui lòng nhập mã ưu đãi.' : promotion ? promotionIssue(promotion, source.serviceId, amount) : '';
    const nextFailures = { ...failures };
    if (issue && code) nextFailures[code] = issue;
    else delete nextFailures[code];
    setPromotionState({ key: pricingContextKey, feedback: issue, failures: nextFailures });
    if (issue) return;
    setError('');
    setPromoInput(code);
    setPromotionCode(code);
    form.retry();
  };
  const [editingAnswers, setEditingAnswers] = useState(false);
  const [requiredRepairs] = useState(() => detail.requirements.filter(field => !!serviceAnswersIssue([field], form.answers)));
  const savedService = source.service;
  const serviceValues = { ...savedService.configuration, ...savedService.answers, ...form.answers };
  const serviceKeys = new Set([...detail.requirements.map(field => field.fieldKey), ...Object.keys(serviceValues)]);
  const serviceAnswers = [...serviceKeys].flatMap(key => {
    const value = serviceValues[key];
    if (value == null || String(value).trim() === '') return [];
    const applies = Object.prototype.hasOwnProperty.call(form.answers, key);
    const label = detail.requirements.find(field => field.fieldKey === key)?.label
      || savedService.answerLabels?.[key] || savedService.configurationLabels?.[key] || key;
    const display = typeof value === 'boolean' ? (value ? 'Có' : 'Không') : Array.isArray(value) ? value.join(', ') : String(value);
    return [{ key, label, display, applies }];
  });
  const editableFields = editingAnswers ? detail.requirements : requiredRepairs;
  const duration = form.quote?.durationMinutes;
  const presetTimes = duration ? rebookTimes(duration, form.now) : [];
  const dates = rebookDates(form.now);
  const [customDate, setCustomDate] = useState('');
  const activeDate = dates.includes(customDate) ? customDate : dates[0];
  const pack = detail.packages.find(item => String(item.id) === form.packageId);
  const related = (source.service as Record<string, unknown>).relatedServices;
  const confirm = async () => {
    if (busy.current || !form.ready) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const raw = await form.submit();
      const saved = bookingView(raw);
      void CustomerBookings.load().catch(() => {});
      const params = { id: saved.id };
      if (bookingRequiresPayment(saved.status)) router.replace({ pathname: '/booking/payment', params });
      else if (saved.mode === 'MODE_A') router.replace({ pathname: '/booking/waiting', params });
      else router.replace({ pathname: '/booking/[id]', params });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Chưa đặt lại được dịch vụ.';
      setError(message);
      form.retry();
    } finally { busy.current = false; setSaving(false); }
  };
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
    <View style={s.header}><Text style={s.heading}>Đặt lại nhanh</Text><BookingExitButton disabled={saving} /></View>
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      <PreviousBooking source={source} detail={detail} />
      <View style={s.card}>
        <View style={s.row}><Text style={s.title}>{detail.service.name}</Text><Pressable accessibilityRole="button" style={s.smallButton} disabled={saving} onPress={() => setPackageOpen(value => !value)}><Text style={s.link}>{packageOpen ? 'Thu gọn' : 'Đổi gói'}</Text></Pressable></View>
        <Text style={s.body}>{pack ? `${pack.name} × ${form.quantity} • ${form.requiredStaffCount} nhân viên` : 'Gói cũ không còn. Vui lòng chọn gói hiện có.'}</Text>
        {(packageOpen || !pack) && detail.packages.map(item => {
          const selected = form.packageId === String(item.id);
          return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} disabled={saving} style={[s.option, selected && s.selected]}
            onPress={() => { form.setPackageId(String(item.id)); setPackageOpen(false); }}>
            <Text style={s.body}>{selected ? '✓ ' : ''}{item.name} · {item.durationMinutes} phút</Text>
          </Pressable>;
        })}
        {!detail.packages.length && <Text style={s.error}>Dịch vụ hiện chưa có gói đang mở đặt lịch.</Text>}
        {detail.service.priceUnit === 'ITEM' && <View pointerEvents={saving ? 'none' : 'auto'}><ServiceQuantity value={form.quantity} change={form.setQuantity} /></View>}
        {!!source.notes && <Text style={s.body}>Ghi chú: {source.notes}</Text>}
      </View>
      <View style={s.card}>
        <View style={s.row}><Text style={s.title}>Địa chỉ thực hiện</Text><Pressable accessibilityRole="button" style={s.smallButton} disabled={saving} onPress={() => setAddressOpen(value => !value)}><Text style={s.link}>{addressOpen ? 'Thu gọn' : 'Đổi địa chỉ'}</Text></Pressable></View>
        {address ? <Text style={s.body}>{address.fullAddress || [address.streetAddress, address.ward, address.city].filter(Boolean).join(', ')}</Text>
          : <Text style={s.small}>{addresses.loading ? 'Đang tải địa chỉ đã lưu…' : 'Chọn một địa chỉ hiện có để tiếp tục.'}</Text>}
        {!!(addresses.error || addresses.refreshError) && <Pressable accessibilityRole="button" style={s.option} onPress={addresses.retry}><Text style={s.error}>{addresses.error || addresses.refreshError} · Tải lại</Text></Pressable>}
        {(addressOpen || !address) && <>
          {addresses.addresses.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === addressId }} disabled={saving}
            style={[s.option, item.id === addressId && s.selected]} onPress={() => { setAddressId(item.id); setAddressOpen(false); }}>
            <Text style={s.body}>{item.title || 'Địa chỉ đã lưu'}</Text><Text style={s.small}>{item.fullAddress || item.streetAddress}</Text>
          </Pressable>)}
          <Pressable accessibilityRole="button" disabled={saving} style={s.option} onPress={() => router.push('/account/addresses')}><Text style={s.link}>Quản lý địa chỉ</Text></Pressable>
        </>}
      </View>
      {(detail.requirements.length > 0 || serviceAnswers.length > 0) && <View style={s.card} onLayout={event => { repairOffset.current = event.nativeEvent.layout.y; }}>
        <View style={s.row}>
          <Text style={s.title}>Thông tin dịch vụ</Text>
          {detail.requirements.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: editingAnswers }}
            style={s.smallButton} disabled={saving} onPress={() => setEditingAnswers(value => !value)}>
            <Text style={s.link}>{editingAnswers ? 'Thu gọn' : 'Chỉnh sửa'}</Text>
          </Pressable>}
        </View>
        {!editingAnswers && serviceAnswers.map(({ key, label, display, applies }) => <View key={key}>
          <Text style={s.label}>{label}</Text>
          <Text style={s.body}>{display}{!applies && ' · Lần trước'}</Text>
        </View>)}
        {!editingAnswers && !serviceAnswers.length && !form.answersIssue && <Text style={s.small}>Chưa có thông tin dịch vụ đã lưu.</Text>}
        {!!form.answersIssue && requiredRepairs.length > 0 && <Text style={s.small}>Bổ sung các mục bắt buộc bên dưới để đặt lại.</Text>}
        {editableFields.length > 0 && <View pointerEvents={saving ? 'none' : 'auto'}>
          <ServiceQuestions fields={editableFields} values={form.answers} change={form.setAnswers} />
        </View>}
        {!!form.answersIssue && <Text accessibilityRole="alert" style={s.error}>{form.answersIssue}</Text>}
      </View>}
      <View style={s.card}><Text style={s.title}>1. Khi nào bạn cần?</Text>
        {presetTimes.map(slot => <Pressable accessibilityRole="radio" accessibilityState={{ checked: form.startsAt === slot.startsAt }} disabled={saving} key={slot.startsAt} onPress={() => form.setStartsAt(slot.startsAt)} style={[s.option, form.startsAt === slot.startsAt && s.selected]}><Text style={s.body}>{slot.label} {form.startsAt === slot.startsAt ? '✓' : ''}</Text></Pressable>)}
        <Pressable accessibilityRole="button" disabled={saving || !duration} style={[s.option, !duration && s.disabled]} onPress={() => { setCustomDate(form.startsAt.slice(0, 10)); setCustomOpen(true); }}><Text style={s.link}>Chọn ngày và giờ khác</Text></Pressable>
        {!duration && <Text style={s.small}>Cần báo giá hiện tại để kiểm tra toàn bộ thời lượng làm việc.</Text>}
        {duration != null && !!form.startsAt && <Text style={s.body}>Đã chọn: {new Date(form.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}–{new Date(Date.parse(form.startsAt) + duration * 60000).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })}</Text>}
        {!!form.timeIssue && <Text style={s.error}>{form.timeIssue}</Text>}
      </View>
      <View style={s.card}><Text style={s.title}>2. Ai sẽ thực hiện?</Text>
        {!form.manualIssue ? <>
          <Pressable disabled={saving || replaceStaff || !form.draft.previousStaffId} onPress={() => form.setMode('KEEP')} style={[s.option, form.mode === 'KEEP' && s.selected, (replaceStaff || !form.draft.previousStaffId) && s.disabled]}><Text style={s.body}>Giữ nhân viên cũ • {form.draft.previousStaffName}</Text></Pressable>
          <Pressable disabled={saving} onPress={() => form.setMode('CHOOSE')} style={[s.option, form.mode === 'CHOOSE' && s.selected]}><Text style={s.body}>Tôi chọn nhân viên khác</Text></Pressable>
        </> : <Text style={s.small}>{form.manualIssue}</Text>}
        <Pressable disabled={saving} onPress={() => form.setMode('AUTO')} style={[s.option, form.mode === 'AUTO' && s.selected]}><Text style={s.body}>Để hệ thống ghép nhân viên phù hợp</Text></Pressable>
        {replaceStaff && <Text style={s.error}>Nhân viên trước chưa nhận lịch. Chọn người khác hoặc để hệ thống ghép; dịch vụ cũ vẫn được giữ.</Text>}
        {form.mode !== 'AUTO' && (!address || form.timeIssue ? <Text style={s.small}>Chọn địa chỉ và giờ hợp lệ để kiểm tra nhân viên.</Text>
          : !form.quote ? <Text style={s.small}>{form.answersIssue ? 'Bổ sung thông tin dịch vụ ở trên để kiểm tra lịch nhân viên.' : form.quoteError ? 'Chưa kiểm tra được lịch do chưa có báo giá hợp lệ.' : 'Đang kiểm tra thời lượng dịch vụ…'}</Text> : form.staffError ? <Pressable accessibilityRole="button" style={s.option} onPress={form.retry}><Text style={s.error}>{form.staffError} • Thử lại</Text></Pressable> : !form.candidates ? <ActivityIndicator color="#00875F" /> : form.mode === 'KEEP' ? <Text style={form.staffAvailable ? s.link : s.error}>{form.staffAvailable ? 'Nhân viên cũ phù hợp giờ đã chọn.' : 'Nhân viên cũ không rảnh hoặc không đáp ứng lịch đã chọn. Vui lòng chọn nhân viên khác hoặc để hệ thống ghép.'}</Text> : <>
          {form.candidates.length === 0 && <Text style={s.small}>Chưa có nhân viên phù hợp. Bạn có thể đổi giờ hoặc để hệ thống ghép.</Text>}
          {form.candidates.filter(person => String(person.id) !== form.draft.previousStaffId).map(person => <Pressable disabled={saving} key={String(person.id)} style={[s.option, form.staffId === String(person.id) && s.selected]} onPress={() => form.setStaffId(String(person.id))}><Text style={s.body}>{String(person.fullName)} {form.staffId === String(person.id) ? '✓' : ''}</Text></Pressable>)}
        </>)}
        {form.mode !== 'AUTO' && <Text style={s.small}>Nhân viên có tối đa 5 phút để nhận lịch. Hết giờ, bạn có thể chọn lại hoặc để hệ thống ghép.</Text>}
      </View>
      <View style={s.card}><View style={s.row}><Text style={s.title}>3. Dịch vụ bổ sung</Text><Pressable accessibilityRole="button" style={s.smallButton} disabled={saving} onPress={() => setExtrasOpen(value => !value)}><Text style={s.link}>{extrasOpen ? 'Thu gọn' : 'Chỉnh sửa'}</Text></Pressable></View>
        {!form.addOnIds.length && !form.relatedServiceIds.length && <Text style={s.small}>Chưa chọn dịch vụ bổ sung.</Text>}
        {form.addOnIds.map(id => {
          const unavailable = form.unavailableAddOns.includes(id);
          const name = detail.addOns.find(item => String(item.id) === id)?.name || source.addOns.find(item => item.addOnId === id)?.addOnName || 'Dịch vụ bổ sung #' + id;
          return <View key={id} style={s.row}><Text style={unavailable ? s.error : s.body}>{name}{unavailable ? ' · Đã ngừng cung cấp' : ''}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ ${name}`} style={s.smallButton} disabled={saving}
              onPress={() => form.setAddOnIds(form.addOnIds.filter(item => item !== id))}><Text style={s.link}>Bỏ</Text></Pressable>
          </View>;
        })}
        {form.relatedServiceIds.map(id => {
          const name = Array.isArray(related) ? related.find(item => String(item?.id) === id)?.name : undefined;
          return <View key={id} style={s.row}><Text style={s.body}>{name || 'Dịch vụ kèm theo'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ ${name || 'dịch vụ kèm theo'}`} style={s.smallButton} disabled={saving}
              onPress={() => form.setRelatedServiceIds(form.relatedServiceIds.filter(item => item !== id))}><Text style={s.link}>Bỏ</Text></Pressable>
          </View>;
        })}
        {extrasOpen && detail.addOns.map(add => { const id = String(add.id), selected = form.addOnIds.includes(id); return <Pressable disabled={saving} key={id} style={[s.option, selected && s.selected]} onPress={() => form.setAddOnIds(selected ? form.addOnIds.filter(value => value !== id) : [...form.addOnIds, id])}><Text style={s.body}>{selected ? '✓ ' : '+ '}{add.name} • {formatVND(add.price)} • +{add.extraDurationMinutes} phút</Text></Pressable>; })}
        {extrasOpen && detail.addOns.length === 0 && <Text style={s.small}>Dịch vụ này chưa có addon.</Text>}
      </View>
      <View style={s.card} pointerEvents={saving ? 'none' : 'auto'}>
        <BookingPromotions promotions={promotionList.items} services={services} serviceId={source.serviceId} amount={amount}
          input={promoInput} changeInput={value => { setPromoInput(value); setPromotionState({ key: pricingContextKey, feedback: '', failures }); }}
          selectedCode={promotionCode} applied={!!promotionCode && !!quote} busy={saving || form.quoteLoading}
          feedback={feedback} failures={failures} apply={applyPromo} clear={() => {
            setPromotionCode(''); setPromoInput(''); setPromotionState({ key: pricingContextKey, feedback: '', failures });
          }} />
        {promotionList.loading && <Text style={s.small}>Đang tải mã giảm giá…</Text>}
        {!!promotionList.error && <Pressable accessibilityRole="button" style={s.option} onPress={() => setPromotionAttempt(value => value + 1)}>
          <Text style={s.error}>{promotionList.error} · Thử lại</Text>
        </Pressable>}
      </View>
      <View style={s.card}><Text style={s.title}>5. Thanh toán</Text>
        {BOOKING_PAYMENT_OPTIONS.map(option => {
          const selected = form.paymentMethod === option.id;
          return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: saving }}
            disabled={saving} onPress={() => { setError(''); form.setPaymentMethod(option.id); }} style={[s.option, selected && s.selected]}>
            <View style={s.paymentOption}><IconSymbol name={option.icon} size={18} color="#047857" />
              <Text style={[s.body, { flex: 1 }]}>{option.name}</Text>
              {selected && <IconSymbol name="check" size={17} color="#047857" />}
            </View>
            <Text style={s.small}>{option.desc}</Text>
            {selected && option.id === 'WALLET' && <WalletBalancePreview />}
          </Pressable>;
        })}
        {!!form.paymentIssue && <Text accessibilityRole="alert" style={s.error}>{form.paymentIssue}</Text>}
      </View>
      <View style={s.card}><Text style={s.title}>6. Kiểm tra tổng tiền</Text>
        {form.answersIssue ? <Pressable accessibilityRole="button" onPress={() => scroll.current?.scrollTo({ y: repairOffset.current, animated: true })}><Text style={s.error}>Bổ sung thông tin dịch vụ để lấy báo giá ↑</Text></Pressable> : form.quote ? <><View style={s.amountRow}><Text style={s.amountLabel}>Dịch vụ</Text><Text style={s.amountValue}>{formatVND(form.quote.baseAmount)}</Text></View><View style={s.amountRow}><Text style={s.amountLabel}>Bổ sung</Text><Text style={s.amountValue}>{formatVND(form.quote.addOnAmount)}</Text></View>{form.quote.discountAmount > 0 && <View style={s.amountRow}><Text style={s.amountLabel}>Khuyến mãi</Text><Text style={s.amountValue}>−{formatVND(form.quote.discountAmount)}</Text></View>}<View style={[s.amountRow, s.totalRow]}><Text style={s.title}>Tổng thanh toán</Text><Text style={s.total}>{formatVND(form.quote.totalAmount)}</Text></View><Text style={s.small}>Thời lượng: {form.quote.durationMinutes} phút • Giá hiện tại từ hệ thống</Text></> : form.quoteError ? <Pressable onPress={form.retry}><Text style={s.error}>{form.quoteError} • Kiểm tra lại</Text></Pressable> : <ActivityIndicator color="#00875F" />}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </ScrollView>
    <View style={s.footer}><Pressable accessibilityRole="button" disabled={saving || !form.ready} onPress={() => void confirm()} style={[s.primary, (saving || !form.ready) && s.disabled]}><Text style={s.white}>{saving ? 'Đang lưu lịch…' : `Xác nhận đặt lại${form.quote ? ' • ' + formatVND(form.quote.totalAmount) : ''}`}</Text></Pressable></View>
    <Modal visible={customOpen} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setCustomOpen(false)}>
      <AppBackground gradient={colors.backgroundGradient}><SafeAreaView style={s.screen}>
        <View style={s.header}><Text style={s.heading}>Chọn thời gian khác</Text>
          <Pressable accessibilityRole="button" style={s.smallButton} onPress={() => setCustomOpen(false)}><Text style={s.link}>Đóng</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.card}>
            <Text style={s.title}>Ngày làm việc</Text>
            <View style={s.wrap}>{dates.map(date => <Pressable key={date} accessibilityRole="radio" accessibilityState={{ checked: date === activeDate }}
              style={[s.option, date === activeDate && s.selected]} onPress={() => setCustomDate(date)}>
              <Text style={s.body}>{date.slice(8)}/{date.slice(5, 7)}</Text>
            </Pressable>)}</View>
            <Text style={s.title}>Giờ bắt đầu</Text>
            <Text style={s.small}>Chọn giờ trước ít nhất 2 tiếng. Toàn bộ ca làm nằm trong 08:00–20:00.</Text>
            <View style={s.wrap}>{REBOOK_HOURS.map(time => {
              const startsAt = rebookStart(activeDate, time);
              const disabled = !duration || !!customerSlotIssue(startsAt, duration, form.now);
              return <Pressable key={time} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
                style={[s.option, form.startsAt === startsAt && s.selected, disabled && s.disabled]}
                onPress={() => { form.setStartsAt(startsAt); setCustomOpen(false); }}>
                <Text style={s.body}>{time}</Text>
              </Pressable>;
            })}</View>
          </View>
        </ScrollView>
      </SafeAreaView></AppBackground>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 21, fontWeight: '800', color: '#064E3B' }, content: { padding: 16, gap: 14, paddingBottom: 24 }, card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCE8E2', borderRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#163A2C', flexShrink: 1 }, body: { fontSize: 14, lineHeight: 21, color: '#334155', flexShrink: 1 }, small: { fontSize: 12, lineHeight: 19, color: '#64748B' },
  option: { padding: 13, borderRadius: 11, borderWidth: 1, borderColor: '#DBE5DF', backgroundColor: '#fff' }, selected: { backgroundColor: '#ECFDF5', borderColor: '#00A675' }, disabled: { opacity: 0.45 },
  smallButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#F0FDF8' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  link: { color: '#00875F', fontWeight: '700', fontSize: 13 }, error: { color: '#B91C1C', lineHeight: 21 }, total: { maxWidth: '55%', textAlign: 'right', fontSize: 20, color: '#00875F', fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }, amountLabel: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 21, color: '#64748B' }, amountValue: { flexShrink: 0, maxWidth: '48%', textAlign: 'right', fontSize: 14, lineHeight: 21, fontWeight: '600', color: '#334155' }, totalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, alignItems: 'center' },
  fill: { flex: 1, gap: 3 }, label: { color: '#334155', fontSize: 13, fontWeight: '600' },
  footer: { padding: 14, backgroundColor: '#fff' }, primary: { backgroundColor: '#00875F', padding: 16, borderRadius: 12, alignItems: 'center' }, white: { color: '#fff', fontWeight: '700', fontSize: 15 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
});
