import type { CatalogDetail } from '@/api/catalog-types';
import { serviceAnswersIssue } from '@/utils/service-requirements';
import { useEffect, useRef, useState } from 'react';
import { operationRequest } from '@/api/operations';
import type { ConnectedBooking } from '@/data/connectedBookings';
import { bookingRetryDraft } from '@/utils/booking-retry';
import { rebookAnswers, rebookQuoteBody, rebookStaffChoices, rebookTimes, type RebookStaffMode } from '@/utils/quick-rebook';
import { customerSlotIssue } from '@/utils/customer-booking-time';
import { retryBookingRead } from '@/utils/booking-read';
import { useBookingResume } from './use-booking-resume';

type Quote = { baseAmount: number; addOnAmount: number; discountAmount: number; totalAmount: number; durationMinutes: number };
export function useQuickRebook(source: ConnectedBooking, replaceStaff: boolean, fields: CatalogDetail['requirements'] = []) {
  const draft = bookingRetryDraft(source);
  const activity = useBookingResume();
  const [startsAt, setStartsAt] = useState(() => rebookTimes(draft.durationMinutes)[0]?.startsAt || '');
  const [mode, setMode] = useState<RebookStaffMode>(replaceStaff || !draft.previousStaffId || source.requiredStaffCount !== 1 ? 'AUTO' : 'KEEP');
  const [staffId, setStaffId] = useState('');
  const [addOnIds, setAddOnIds] = useState(source.addOns.map(item => item.addOnId));
  const [promotionCode, setPromotionCode] = useState(draft.promotionCode);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER_QR'>(source.paymentMethod === 'CASH' ? 'CASH' : 'BANK_TRANSFER_QR');
  const paymentIssue = paymentMethod === 'CASH' ? '' : 'Chuyển khoản/QR chưa được cấu hình. Vui lòng chọn tiền mặt để đặt dịch vụ.';
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState(() => rebookAnswers(source, fields));
  const answersIssue = serviceAnswersIssue(fields, answers);
  const body = { ...rebookQuoteBody(source, addOnIds, promotionCode), answers };
  const bodyKey = JSON.stringify(body);
  const quoteKey = `${bodyKey}:${activity.revision}:${Math.floor(activity.now / 120000)}:${attempt}`;
  const [pricing, setPricing] = useState<{ key: string; quote?: Quote; error?: string }>({ key: '' });
  const [people, setPeople] = useState<{ key: string; rows?: Record<string, unknown>[]; error?: string }>({ key: '' });
  const request = useRef<{ serialized: string; key: string } | null>(null);
  useEffect(() => {
    if (!activity.active || answersIssue) return;
    const controller = new AbortController();
    setPricing({ key: quoteKey });
    const timer = setTimeout(() => void retryBookingRead(() => operationRequest<Quote>('catalog', '/quote-preview', 'POST', JSON.parse(bodyKey), controller.signal), controller.signal)
      .then(quote => { if (!controller.signal.aborted) setPricing({ key: quoteKey, quote }); })
      .catch(error => { if (!controller.signal.aborted) setPricing({ key: quoteKey, error: error.message }); }), 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [bodyKey, quoteKey, activity.active, answersIssue]);
  const quote = pricing.key === quoteKey && activity.active && !answersIssue ? pricing.quote : undefined;
  const timeIssue = quote ? customerSlotIssue(startsAt, quote.durationMinutes, activity.now) : '';
  const staffKey = `${quoteKey}:${startsAt}:${mode}`;
  useEffect(() => {
    if (!activity.active || !quote || timeIssue || mode === 'AUTO') return;
    const controller = new AbortController();
    setPeople({ key: staffKey });
    const serviceIds = [body.serviceId, ...body.relatedServiceIds];
    void Promise.all(serviceIds.map(serviceId => {
      const query = new URLSearchParams({ serviceId, addressId: source.addressId, startsAt, durationMinutes: String(quote.durationMinutes) });
      return operationRequest<Record<string, unknown>[]>('booking', '/customer/staff?' + query, 'GET', undefined, controller.signal);
    })).then(lists => { if (!controller.signal.aborted) setPeople({ key: staffKey, rows: rebookStaffChoices(lists, replaceStaff ? draft.previousStaffId : '') }); })
      .catch(error => { if (!controller.signal.aborted) setPeople({ key: staffKey, error: error.message }); });
    return () => controller.abort();
  }, [staffKey, !!quote, activity.active, timeIssue]);
  const candidates = people.key === staffKey ? people.rows : undefined;
  const selectedStaffId = mode === 'KEEP' ? draft.previousStaffId : mode === 'CHOOSE' ? staffId : '';
  const staffAvailable = mode === 'AUTO' || !!candidates?.some(person => String(person.id) === selectedStaffId);
  const ready = !!quote && !timeIssue && staffAvailable && activity.active && !paymentIssue;
  const submit = async () => {
    if (paymentIssue) throw new Error(paymentIssue);
    if (answersIssue) throw new Error(answersIssue);
    if (!ready) throw new Error('Vui lòng chờ kiểm tra giá, thời gian và nhân viên phù hợp.');
    const issue = customerSlotIssue(startsAt, quote!.durationMinutes);
    if (issue) throw new Error(issue);
    const payload = { ...body, startsAt, mode: mode === 'AUTO' ? 'MODE_B' : 'MODE_A', staffId: mode === 'AUTO' ? undefined : selectedStaffId,
      addressId: source.addressId, notes: draft.notes, paymentMethod };
    const serialized = JSON.stringify(payload);
    if (request.current?.serialized !== serialized) request.current = { serialized, key: 'rebook-' + Date.now() + '-' + Math.random().toString(36).slice(2) };
    return operationRequest<Record<string, unknown>>('booking', '/bookings', 'POST', { ...payload, requestKey: request.current.key });
  };
  return { draft, answers, setAnswers, answersIssue, startsAt, setStartsAt, mode, setMode, staffId, setStaffId, addOnIds, setAddOnIds, promotionCode, setPromotionCode, paymentMethod, setPaymentMethod, paymentIssue,
    quote, quoteError: pricing.key === quoteKey ? pricing.error : '', candidates, staffError: people.key === staffKey ? people.error : '',
    staffAvailable, ready, timeIssue, submit, retry: () => setAttempt(value => value + 1) };
}
