import type { ConnectedBooking } from '@/data/connectedBookings';

export const needsStaffResponse = (booking: ConnectedBooking) => booking.mode === 'MODE_A' &&
  ((booking.status === 'STAFF_ASSIGNED' && booking.staffWaitState === 'WAITING') ||
    (booking.status === 'CANCELLED' && booking.staffWaitState === 'EXPIRED'));

export function responseSeconds(deadline: string | undefined, now: number) {
  const end = Date.parse(deadline || '');
  return Number.isFinite(end) ? Math.max(0, Math.ceil((end - now) / 1000)) : 0;
}

export function responseClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
