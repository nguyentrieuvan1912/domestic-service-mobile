export const BOOKING_LEAD_MS = 2 * 60 * 60 * 1000;
export function customerSlotIssue(startsAt: string, minutes: number, now = Date.now()): string {
  const start = Date.parse(startsAt), end = start + minutes * 60000;
  if (!Number.isFinite(start) || !Number.isFinite(minutes) || minutes <= 0) return 'Vui lòng chọn ngày giờ và thời lượng hợp lệ.';
  if (start < now + BOOKING_LEAD_MS) return 'Giờ bắt đầu phải cách thời điểm hiện tại tối thiểu 2 giờ.';
  const local = (value: number) => new Date(value + 7 * 3600000).toISOString();
  const from = local(start), to = local(end), today = local(now).slice(0, 10);
  const lastDay = new Date(Date.parse(today + 'T12:00:00Z') + 6 * 86400000).toISOString().slice(0, 10);
  if (from.slice(0, 10) > lastDay) return 'Chỉ đặt trong hôm nay và 6 ngày tiếp theo.';
  if (from.slice(0, 10) !== to.slice(0, 10) || from.slice(11, 16) < '08:00' || to.slice(11, 19) > '20:00:00') return 'Toàn bộ thời gian làm việc phải nằm trong 08:00–20:00 cùng ngày.';
  return '';
}
