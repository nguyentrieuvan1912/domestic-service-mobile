import type { AvailabilityDay, AvailabilityInterval } from '@/types/staff-availability';
import { addCalendarDays, intervalFor, localDate, SCHEDULE_TIME_OPTIONS } from './staffAvailabilityRules';

export function weekStart(now = Date.now()): string {
  const date = localDate(now), weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addCalendarDays(date, -(weekday + 6) % 7);
}
export const weekDates = (start: string) => Array.from({ length: 7 }, (_, i) => addCalendarDays(start, i));
export const WEEK_SLOTS = SCHEDULE_TIME_OPTIONS.slice(0, -1);
export const WORK_SHIFTS = [{ title: 'Sáng', start: '08:00', end: '12:00' }, { title: 'Chiều', start: '12:00', end: '17:00' }, { title: 'Tối', start: '17:00', end: '20:00' }] as const;
export function toggleShift(day: AvailabilityDay, start: string, end: string, now: number): AvailabilityDay {
  const before = selectedSlots(day), times = WEEK_SLOTS.filter(time => time >= start && time < end && !slotLocked(day.date, time, now));
  const remove = times.length > 0 && times.every(time => before.includes(time));
  return setDaySlots(day, remove ? before.filter(time => !times.includes(time)) : [...before, ...times], now);
}
export function missingRegistrationDates(registeredWeeks: readonly string[], now = Date.now()): string[] {
  const start = weekStart(now);
  return registeredWeeks.includes(start) ? [] : weekDates(start).filter(date => date >= localDate(now));
}
export function selectedSlots(day: AvailabilityDay): string[] {
  return WEEK_SLOTS.filter(time => day.intervals.some(period => Date.parse(period.startsAt) <= Date.parse(intervalFor(day.date, time, time).startsAt) && Date.parse(period.endsAt) >= Date.parse(intervalFor(day.date, time, SCHEDULE_TIME_OPTIONS[SCHEDULE_TIME_OPTIONS.indexOf(time) + 1]).endsAt)));
}
export function intervalsFromSlots(date: string, slots: readonly string[]): AvailabilityInterval[] {
  const result: AvailabilityInterval[] = [];
  for (const time of WEEK_SLOTS.filter(value => slots.includes(value))) {
    const end = SCHEDULE_TIME_OPTIONS[SCHEDULE_TIME_OPTIONS.indexOf(time) + 1];
    const period = intervalFor(date, time, end), last = result.at(-1);
    if (last?.endsAt === period.startsAt) last.endsAt = period.endsAt;
    else result.push(period);
  }
  return result;
}
export const slotLocked = (date: string, time: string, now: number) => Date.parse(intervalFor(date, time, time).startsAt) <= now;
export function setDaySlots(day: AvailabilityDay, desired: readonly string[], now: number): AvailabilityDay {
  const before = selectedSlots(day);
  return { ...day, intervals: intervalsFromSlots(day.date, WEEK_SLOTS.filter(time => slotLocked(day.date, time, now) ? before.includes(time) : desired.includes(time))) };
}
