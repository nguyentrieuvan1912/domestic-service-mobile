import type { ConnectedBooking } from '../data/connectedBookings';

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** Rebuild a new selection from the owned, persisted order; never reuse its quote or request key. */
export function bookingRetryDraft(booking: ConnectedBooking) {
  const snapshot = booking.service as Record<string, unknown>;
  const configuration = object(snapshot.configuration);
  const related = Array.isArray(snapshot.relatedServices) ? snapshot.relatedServices.map(item => String(object(item).id)).filter(id => /^\d+$/.test(id)) : [];
  const previous = booking.assignments.at(-1);
  return {
    serviceId: booking.serviceId, packageId: booking.packageId, addressId: booking.addressId,
    date: booking.bookingDate, time: booking.startTime.slice(0, 5),
    durationMinutes: Math.ceil((Date.parse(booking.endsAt) - Date.parse(booking.startsAt)) / 60000),
    extraKeys: [...booking.addOns.map(item => 'addon:' + item.addOnId), ...related.map(id => 'service:' + id)],
    answers: object(snapshot.answers), configuration, quantity: Number(snapshot.quantity || configuration.acQuantity || 1),
    promotionCode: booking.promotionCode || '', notes: booking.notes || '',
    previousStaffId: previous?.staffId || booking.staffId || '',
    previousStaffName: String(booking.staff?.fullName || previous?.staffSnapshot?.fullName || 'Nhân viên đã chọn'),
  };
}
