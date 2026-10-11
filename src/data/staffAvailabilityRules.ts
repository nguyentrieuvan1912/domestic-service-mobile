import type { AvailabilityDay, AvailabilityDraft, AvailabilityInterval, ScheduleBooking, ScheduleResult } from '../types/staff-availability';
import { STAFF_AREA_OPTIONS, areaNamesForIds } from './staffAreas';

export const STAFF_SCHEDULE_POLICY = {
  timeZone: 'Asia/Ho_Chi_Minh', isoOffset: '+07:00', days: 7, stepMinutes: 30,
  startMinute: 8 * 60, endMinute: 20 * 60, bufferMinutes: 60, mergeTouching: true,
  // UI assumption pending policy approval: booking end <= 20:00; its buffer may extend beyond 20:00.
  bufferMustEndWithinHours: false,
} as const;
const minuteMs = 60000;
export function localDate(now: number | string = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: STAFF_SCHEDULE_POLICY.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function addCalendarDays(date: string, count: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + count * 86400000).toISOString().slice(0, 10);
}
// "7 days" includes today (00:00 in the configured timezone) plus the next six calendar dates.
// An interval for today may cover an already accepted job; new claims still reject startsAt <= now.
export function scheduleDates(now = Date.now()): string[] {
  const today = localDate(now);
  return Array.from({ length: STAFF_SCHEDULE_POLICY.days }, (_, index) => addCalendarDays(today, index));
}
export function timeLabel(minute: number): string { return `${Math.floor(minute / 60).toString().padStart(2, '0')}:${(minute % 60).toString().padStart(2, '0')}`; }
export const SCHEDULE_TIME_OPTIONS = Array.from({ length: (STAFF_SCHEDULE_POLICY.endMinute - STAFF_SCHEDULE_POLICY.startMinute) / STAFF_SCHEDULE_POLICY.stepMinutes + 1 }, (_, index) => timeLabel(STAFF_SCHEDULE_POLICY.startMinute + index * STAFF_SCHEDULE_POLICY.stepMinutes));
export function intervalFor(date: string, start: string, end: string): AvailabilityInterval {
  return { startsAt: `${date}T${start}:00${STAFF_SCHEDULE_POLICY.isoOffset}`, endsAt: `${date}T${end}:00${STAFF_SCHEDULE_POLICY.isoOffset}` };
}
export function displayTime(instant: string): string {
  return new Date(instant).toLocaleTimeString('vi-VN', { timeZone: STAFF_SCHEDULE_POLICY.timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
}
export function displayDate(date: string): string {
  return new Date(`${date}T12:00:00${STAFF_SCHEDULE_POLICY.isoOffset}`).toLocaleDateString('vi-VN', { timeZone: STAFF_SCHEDULE_POLICY.timeZone, weekday: 'short', day: '2-digit', month: '2-digit' });
}
function intervalIssue(interval: AvailabilityInterval, date: string): string | undefined {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+07:00$/.test(value) || !Number.isFinite(Date.parse(value)) || localDate(value) !== date) return undefined;
    const time = displayTime(value).split(':').map(Number);
    return time[0] * 60 + time[1];
  };
  const start = parse(interval.startsAt), end = parse(interval.endsAt);
  if (start === undefined || end === undefined) return 'Ngày giờ không hợp lệ hoặc không cùng ngày theo giờ Việt Nam.';
  if (start % STAFF_SCHEDULE_POLICY.stepMinutes || end % STAFF_SCHEDULE_POLICY.stepMinutes) return 'Giờ bắt đầu và kết thúc phải theo bước 30 phút (ví dụ 08:00 hoặc 08:30).';
  if (start >= end) return 'Giờ bắt đầu phải trước giờ kết thúc.';
  if (start < STAFF_SCHEDULE_POLICY.startMinute || end > STAFF_SCHEDULE_POLICY.endMinute) return 'Khoảng rảnh phải nằm trong 08:00–20:00.';
}
export function normalizeDay(day: AvailabilityDay): { day?: AvailabilityDay; error?: string } {
  const sorted = day.intervals.map(item => ({ ...item })).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const merged: AvailabilityInterval[] = [];
  for (const interval of sorted) {
    const error = intervalIssue(interval, day.date);
    if (error) return { error };
    const previous = merged.at(-1);
    if (previous && Date.parse(interval.startsAt) < Date.parse(previous.endsAt)) return { error: 'Các khoảng rảnh đang chồng nhau. Hãy sửa giờ hoặc xóa khoảng trùng.' };
    if (previous && STAFF_SCHEDULE_POLICY.mergeTouching && interval.startsAt === previous.endsAt) previous.endsAt = interval.endsAt;
    else merged.push(interval);
  }
  return { day: { date: day.date, intervals: merged } };
}
export const intervalContains = (outer: AvailabilityInterval, inner: AvailabilityInterval) => Date.parse(outer.startsAt) <= Date.parse(inner.startsAt) && Date.parse(inner.endsAt) <= Date.parse(outer.endsAt);
export const intervalsOverlap = (a: AvailabilityInterval, b: AvailabilityInterval) => Date.parse(a.startsAt) < Date.parse(b.endsAt) && Date.parse(b.startsAt) < Date.parse(a.endsAt);
export function bookingBuffer(booking: AvailabilityInterval): AvailabilityInterval {
  return { startsAt: new Date(Date.parse(booking.startsAt) - STAFF_SCHEDULE_POLICY.bufferMinutes * minuteMs).toISOString(), endsAt: new Date(Date.parse(booking.endsAt) + STAFF_SCHEDULE_POLICY.bufferMinutes * minuteMs).toISOString() };
}
export const bookingWorkMinutes = (booking: AvailabilityInterval) => (Date.parse(booking.endsAt) - Date.parse(booking.startsAt)) / minuteMs;
export function normalizeDraft(draft: AvailabilityDraft, bookings: readonly ScheduleBooking[], now = Date.now()): { draft?: AvailabilityDraft; error?: string } {
  const dates = scheduleDates(now);
  if (draft.days.length !== dates.length || dates.some(date => draft.days.filter(day => day.date === date).length !== 1)) return { error: 'Cửa sổ 7 ngày đã thay đổi hoặc dữ liệu ngày không hợp lệ. Hãy tải lại lịch.' };
  if (!draft.areaIds.length || draft.areaIds.some(id => !STAFF_AREA_OPTIONS.some(area => area.id === id)) || new Set(draft.areaIds).size !== draft.areaIds.length) return { error: 'Chọn ít nhất một khu vực hợp lệ, không trùng nhau.' };
  if (typeof draft.matchNotifications !== 'boolean') return { error: 'Tùy chọn nhận thông báo không hợp lệ.' };
  const days: AvailabilityDay[] = [];
  for (const date of dates) {
    const result = normalizeDay(draft.days.find(day => day.date === date)!);
    if (!result.day) return { error: `${displayDate(date)}: ${result.error}` };
    days.push(result.day);
  }
  const areaNames = areaNamesForIds(draft.areaIds);
  for (const booking of bookings) {
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED' || !dates.includes(localDate(booking.startsAt))) continue;
    if (!days.find(day => day.date === localDate(booking.startsAt))?.intervals.some(interval => intervalContains(interval, booking))) return { error: `Ca ${booking.bookingCode} đã nhận phải nằm trọn trong lịch rảnh. Giữ khoảng ${displayTime(booking.startsAt)}–${displayTime(booking.endsAt)} hoặc liên hệ hỗ trợ về ca này.` };
    if (!areaNames.includes(booking.district)) return { error: `Ca ${booking.bookingCode} đã nhận ở ${booking.district}. Giữ khu vực này khi đăng ký lịch.` };
  }
  return { draft: { days, areaIds: [...draft.areaIds].sort(), matchNotifications: draft.matchNotifications } };
}
export function canScheduleBooking(saved: AvailabilityDraft, booking: ScheduleBooking, existing: readonly ScheduleBooking[], now = Date.now()): ScheduleResult {
  if (!Number.isFinite(Date.parse(booking.startsAt)) || !Number.isFinite(Date.parse(booking.endsAt))) return { allowed: false, code: 'TIME_INVALID', reason: 'Ca chưa có giờ xác nhận hợp lệ để kiểm tra lịch.' };
  const date = localDate(booking.startsAt);
  const issue = intervalIssue(booking, date);
  if (issue) return { allowed: false, code: 'TIME_INVALID', reason: issue };
  if (!scheduleDates(now).includes(date)) return { allowed: false, code: 'OUTSIDE_WINDOW', reason: 'Ca nằm ngoài cửa sổ đăng ký 7 ngày.' };
  if (Date.parse(booking.startsAt) <= now) return { allowed: false, code: 'PAST_START', reason: 'Ca đã đến hoặc qua giờ bắt đầu.' };
  const endTime = displayTime(booking.endsAt).split(':').map(Number);
  if (STAFF_SCHEDULE_POLICY.bufferMustEndWithinHours && endTime[0] * 60 + endTime[1] + STAFF_SCHEDULE_POLICY.bufferMinutes > STAFF_SCHEDULE_POLICY.endMinute) return { allowed: false, code: 'TIME_INVALID', reason: 'Vùng đệm sau ca phải kết thúc trong giờ hoạt động theo chính sách hiện tại.' };
  if (!areaNamesForIds(saved.areaIds).includes(booking.district)) return { allowed: false, code: 'AREA_OUTSIDE', reason: 'Ca nằm ngoài khu vực bạn đã lưu.' };
  if (!saved.days.find(day => day.date === date)?.intervals.some(interval => intervalContains(interval, booking))) return { allowed: false, code: 'OUTSIDE_AVAILABILITY', reason: 'Toàn bộ thời gian ca phải nằm trong một khoảng rảnh đã lưu.' };
  for (const other of existing) {
    if (other.id === booking.id || other.status === 'CANCELLED') continue;
    if (!Number.isFinite(Date.parse(other.startsAt)) || !Number.isFinite(Date.parse(other.endsAt)) || Date.parse(other.startsAt) >= Date.parse(other.endsAt)) return { allowed: false, code: 'SCHEDULE_INVALID', reason: 'Cần xác minh giờ ca đã nhận trước khi nhận thêm việc.' };
    if (intervalsOverlap(booking, bookingBuffer(other))) return { allowed: false, code: 'BOOKING_CONFLICT', reason: `Trùng ca hoặc chưa đủ đệm 60 phút với ${other.bookingCode} (${displayTime(other.startsAt)}–${displayTime(other.endsAt)}).` };
  }
  return { allowed: true };
}
