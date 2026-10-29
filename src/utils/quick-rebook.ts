import type { CatalogDetail } from '../api/catalog-types';
import { serviceAnswersIssue } from './service-requirements';
import type { ConnectedBooking } from '../data/connectedBookings';
import { bookingRetryDraft } from './booking-retry';
import { customerSlotIssue } from './customer-booking-time';

export type RebookStaffMode = 'KEEP' | 'CHOOSE' | 'AUTO';
export function rebookTimes(minutes: number, now = Date.now()) {
  const today = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
  const rows: { startsAt: string; label: string }[] = [];
  // Only real future slots within the existing seven-day service window.
  for (let day = 1; day <= 6 && rows.length < 3; day++) {
    const date = new Date(Date.parse(today + 'T12:00:00Z') + day * 86400000).toISOString().slice(0, 10);
    for (const time of minutes > 690 ? ['08:00'] : ['08:30', '14:00']) {
      const startsAt = date + 'T' + time + ':00+07:00';
      if (!customerSlotIssue(startsAt, minutes, now)) rows.push({ startsAt, label: `${day === 1 ? 'Ngày mai' : new Date(startsAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} • ${time}` });
      if (rows.length === 3) break;
    }
  }
  return rows;
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
  const answers = { ...draft.answers };
  for (const field of fields) {
    if (answers[field.fieldKey] == null && draft.configuration[field.fieldKey] != null) {
      const value = draft.configuration[field.fieldKey];
      if (!serviceAnswersIssue([field], { [field.fieldKey]: value })) answers[field.fieldKey] = value;
    }
  }
  return answers;
}
