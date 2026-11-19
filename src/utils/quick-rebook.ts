import type { CatalogDetail } from '../api/catalog-types';
import { serviceAnswersIssue } from './service-requirements';
import type { ConnectedBooking } from '../data/connectedBookings';
import { bookingRetryDraft } from './booking-retry';
import { customerSlotIssue } from './customer-booking-time';

export type RebookStaffMode = 'KEEP' | 'CHOOSE' | 'AUTO';
export const REBOOK_HOURS = Array.from({ length: 24 }, (_, slot) => `${String(8 + Math.floor(slot / 2)).padStart(2, '0')}:${slot % 2 ? '30' : '00'}`);

export function rebookDates(now = Date.now()) {
  const today = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
  return Array.from({ length: 7 }, (_, day) =>
    new Date(Date.parse(today + 'T12:00:00Z') + day * 86400000).toISOString().slice(0, 10));
}

export const rebookStart = (date: string, time: string) => `${date}T${time}:00+07:00`;

export function rebookTimes(minutes: number, now = Date.now()) {
  const byDay = rebookDates(now).map((date, day) => {
    const label = day === 0 ? 'Hôm nay' : day === 1 ? 'Ngày mai' : `${date.slice(8)}/${date.slice(5, 7)}`;
    return REBOOK_HOURS.map(time => ({ startsAt: rebookStart(date, time), label: `${label} • ${time}` }))
      .filter(slot => !customerSlotIssue(slot.startsAt, minutes, now));
  }).filter(slots => slots.length > 0);
  return [...byDay.map(slots => slots[0]), ...byDay.flatMap(slots => slots.slice(1))].slice(0, 3);
}
export function rebookQuoteBody(source: ConnectedBooking, addOnIds: string[], promotionCode: string) {
  const draft = bookingRetryDraft(source);
  return { serviceId: source.serviceId, packageId: source.packageId, requiredStaffCount: source.requiredStaffCount,
    quantity: draft.quantity, configuration: draft.configuration, answers: draft.answers, addOnIds,
    relatedServiceIds: draft.extraKeys.filter(key => key.startsWith('service:')).map(key => key.slice(8)), promotionCode };
}
export function rebookStaffChoices(rows: Record<string, unknown>[][], excludedId = '') {
  return (rows[0] || []).filter(person => String(person.id) !== excludedId && rows.every(list => list.some(item => String(item.id) === String(person.id))));
}

/** Restore only values actually saved on this order, including older configuration storage. */
export function rebookAnswers(source: ConnectedBooking, fields: CatalogDetail['requirements']) {
  const draft = bookingRetryDraft(source);
  const answers: Record<string, unknown> = {};
  for (const field of fields) {
    const value = draft.answers[field.fieldKey] ?? draft.configuration[field.fieldKey];
    if (value != null && !serviceAnswersIssue([field], { [field.fieldKey]: value })) answers[field.fieldKey] = value;
  }
  return answers;
}
