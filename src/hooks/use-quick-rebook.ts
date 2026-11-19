import type { CatalogDetail } from '@/api/catalog-types';
import { serviceAnswersIssue } from '@/utils/service-requirements';
import { useEffect, useRef, useState } from 'react';
import { operationRequest } from '@/api/operations';
import type { ConnectedBooking } from '@/data/connectedBookings';
import { bookingRetryDraft } from '@/utils/booking-retry';
import { rebookAnswers, rebookQuoteBody, rebookStaffChoices, rebookTimes, type RebookStaffMode } from '@/utils/quick-rebook';
import { customerSlotIssue } from '@/utils/customer-booking-time';
import { retryBookingRead } from '@/utils/booking-read';
import { paymentMethodFromBooking, type BookingPaymentMethod } from '@/utils/booking-payment-options';
import { favouriteDurationIssue } from '@/utils/favourite-staff-duration';
import { minimumStaffForArea } from '@/utils/service-setup';
import { useBookingResume } from './use-booking-resume';

type Quote = {
  baseAmount: number; addOnAmount: number; discountAmount: number; totalAmount: number; durationMinutes: number;
  snapshot?: { addOns?: { durationMinutes: number }[]; relatedServices?: { durationMinutes: number }[] };
};
export function useQuickRebook(source: ConnectedBooking, replaceStaff: boolean, fields: CatalogDetail['requirements'] = [],
  { detail, addressId = source.addressId }: { detail?: CatalogDetail; addressId?: string } = {}) {
  const draft = bookingRetryDraft(source);
  const activity = useBookingResume();
  const [clock, setClock] = useState(Date.now);
  const now = Math.max(clock, activity.now);
  useEffect(() => {
    if (!activity.active) return;
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [activity.active]);
  const [startsAt, setStartsAt] = useState(() => rebookTimes(draft.durationMinutes)[0]?.startsAt || '');
  const [staffMode, setMode] = useState<RebookStaffMode>(replaceStaff || !draft.previousStaffId || source.requiredStaffCount !== 1 ? 'AUTO' : 'KEEP');
  const [staffId, setStaffId] = useState('');
  const [addOnIds, setAddOnIds] = useState(source.addOns.map(item => item.addOnId));
  const [relatedServiceIds, setRelatedServiceIds] = useState(() => rebookQuoteBody(source, [], '').relatedServiceIds);
  const [packageId, setPackageId] = useState(source.packageId);
  const [quantity, setQuantity] = useState(detail && detail.service.priceUnit !== 'ITEM' ? 1 : draft.quantity);
  const [promotionCode, setPromotionCode] = useState(draft.promotionCode);
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethod | null>(() => paymentMethodFromBooking(source.paymentMethod));
  const paymentIssue = paymentMethod ? '' : 'Vui lòng chọn phương thức thanh toán hiện có để đặt lại.';
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState(() => rebookAnswers(source, fields));
  const answersIssue = serviceAnswersIssue(fields, answers);
  const pack = detail?.packages.find(item => String(item.id) === packageId);
  const unavailableAddOns = detail ? addOnIds.filter(id => !detail.addOns.some(item => String(item.id) === id)) : [];
  const selectionIssue = detail && !pack ? 'Chọn một gói dịch vụ đang được cung cấp.'
    : unavailableAddOns.length ? 'Bỏ dịch vụ bổ sung đã ngừng cung cấp để lấy báo giá mới.'
    : pack && pack.durationMinutes * quantity > 720 ? 'Gói chính vượt quá 12 giờ. Vui lòng giảm số lượng hoặc chọn gói khác.' : '';
  const requiredStaffCount = Math.max(source.requiredStaffCount || 1, detail ? minimumStaffForArea(detail, packageId, answers, quantity) : 1);
  const pricingIssue = selectionIssue || (requiredStaffCount > 20 ? 'Diện tích vượt định mức của gói. Vui lòng chọn gói khác.' : '');
  const configuration = 'acQuantity' in draft.configuration ? { ...draft.configuration, acQuantity: quantity } : draft.configuration;
  const body = { ...rebookQuoteBody(source, addOnIds, promotionCode), answers, packageId, quantity, configuration, requiredStaffCount, relatedServiceIds };
  const pricingContextKey = JSON.stringify({ ...body, promotionCode: '' });
  const bodyKey = JSON.stringify(body);
  const quoteKey = `${bodyKey}:${activity.revision}:${Math.floor(now / 120000)}:${attempt}`;
  const [pricing, setPricing] = useState<{ key: string; quote?: Quote; error?: string }>({ key: '' });
  const [people, setPeople] = useState<{ key: string; rows?: Record<string, unknown>[]; error?: string }>({ key: '' });
  const request = useRef<{ serialized: string; key: string } | null>(null);
  useEffect(() => {
    if (!activity.active || answersIssue || pricingIssue) return;
    const controller = new AbortController();
    setPricing({ key: quoteKey });
    const timer = setTimeout(() => void retryBookingRead(() => operationRequest<Quote>('catalog', '/quote-preview', 'POST', JSON.parse(bodyKey), controller.signal), controller.signal)
      .then(quote => { if (!controller.signal.aborted) setPricing({ key: quoteKey, quote }); })
      .catch(error => { if (!controller.signal.aborted) setPricing({ key: quoteKey, error: error.message }); }), 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [bodyKey, quoteKey, activity.active, answersIssue, pricingIssue]);
  const quote = pricing.key === quoteKey && activity.active && !answersIssue && !pricingIssue ? pricing.quote : undefined;
  const quoteLoading = activity.active && !answersIssue && !pricingIssue
    && (pricing.key !== quoteKey || (!pricing.quote && !pricing.error));
  const timeIssue = quote ? customerSlotIssue(startsAt, quote.durationMinutes, now) : '';
  const quotedExtras = quote?.snapshot ? [...(quote.snapshot.addOns ?? []), ...(quote.snapshot.relatedServices ?? [])] : undefined;
  const baseMinutes = pack ? pack.durationMinutes * quantity : 0;
  const extraMinutes = quotedExtras?.reduce((sum, item) => sum + item.durationMinutes, 0)
    ?? Math.max(0, (quote?.durationMinutes ?? baseMinutes) - baseMinutes);
  const manualIssue = requiredStaffCount > 1 ? `Gói này cần ${requiredStaffCount} nhân viên. Hệ thống sẽ điều phối đủ người.`
    : favouriteDurationIssue(quote ? quote.durationMinutes - extraMinutes : baseMinutes, extraMinutes, addOnIds.length + relatedServiceIds.length);
  const mode = manualIssue ? 'AUTO' : staffMode;
  const staffKey = `${quoteKey}:${addressId}:${startsAt}:${mode}`;
  useEffect(() => {
    if (!activity.active || !quote || timeIssue || !addressId || mode === 'AUTO') return;
    const controller = new AbortController();
    setPeople({ key: staffKey });
    const serviceIds = [body.serviceId, ...body.relatedServiceIds];
    void Promise.all(serviceIds.map(serviceId => {
      const query = new URLSearchParams({ serviceId, addressId, startsAt, durationMinutes: String(quote.durationMinutes) });
      return operationRequest<Record<string, unknown>[]>('booking', '/customer/staff?' + query, 'GET', undefined, controller.signal);
    })).then(lists => { if (!controller.signal.aborted) setPeople({ key: staffKey, rows: rebookStaffChoices(lists, replaceStaff ? draft.previousStaffId : '') }); })
      .catch(error => { if (!controller.signal.aborted) setPeople({ key: staffKey, error: error.message }); });
    return () => controller.abort();
  }, [staffKey, !!quote, activity.active, timeIssue]);
  const candidates = people.key === staffKey ? people.rows : undefined;
  const selectedStaffId = mode === 'KEEP' ? draft.previousStaffId : mode === 'CHOOSE' ? staffId : '';
  const staffAvailable = mode === 'AUTO' || !!candidates?.some(person => String(person.id) === selectedStaffId);
  const ready = !!quote && !!addressId && !timeIssue && staffAvailable && activity.active && !paymentIssue;
  const submit = async () => {
    if (paymentIssue) throw new Error(paymentIssue);
    if (answersIssue) throw new Error(answersIssue);
    if (!ready) throw new Error('Vui lòng chờ kiểm tra giá, thời gian và nhân viên phù hợp.');
    const issue = customerSlotIssue(startsAt, quote!.durationMinutes);
    if (issue) throw new Error(issue);
    const payload = { ...body, startsAt, mode: mode === 'AUTO' ? 'MODE_B' : 'MODE_A', staffId: mode === 'AUTO' ? undefined : selectedStaffId,
      addressId, notes: draft.notes, paymentMethod };
    const serialized = JSON.stringify(payload);
    if (request.current?.serialized !== serialized) request.current = { serialized, key: 'rebook-' + Date.now() + '-' + Math.random().toString(36).slice(2) };
    return operationRequest<Record<string, unknown>>('booking', '/bookings', 'POST', { ...payload, requestKey: request.current.key });
  };
  return { draft, answers, setAnswers, answersIssue, startsAt, setStartsAt, mode, setMode, staffId, setStaffId, addOnIds, setAddOnIds,
    relatedServiceIds, setRelatedServiceIds, packageId, setPackageId, quantity, setQuantity, requiredStaffCount, manualIssue,
    promotionCode, setPromotionCode, paymentMethod, setPaymentMethod, paymentIssue, unavailableAddOns,
    quote, quoteLoading, pricingContextKey, quoteError: pricingIssue || (pricing.key === quoteKey ? pricing.error : ''), candidates, staffError: people.key === staffKey ? people.error : '',
    staffAvailable, ready, timeIssue, now, submit, retry: () => setAttempt(value => value + 1) };
}
