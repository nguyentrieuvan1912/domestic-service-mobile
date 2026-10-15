import type { BookingMode } from '../types/booking';
// A field is discarded only when its owning step is after the destination.
export function laterBookingSections(mode: BookingMode, destination: number) {
  const ownership = mode === 'MODE_A'
    ? { address: 0, time: 1, preferences: 2, staffFilters: 3, staff: 4, package: 5, answers: 5, extras: 5, summary: 6, payment: 7 }
    : { package: 0, answers: 0, extras: 1, address: 2, time: 3, summary: 4, payment: 5, preferences: -1, staffFilters: -1, staff: -1 };
  return new Set(Object.entries(ownership).filter(([, step]) => step > destination).map(([field]) => field));
}
