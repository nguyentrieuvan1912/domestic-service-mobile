import { customerSlotIssue } from './customer-booking-time';

export type BookingTimingNotice = { kind: 'PACKAGE' | 'EXTRAS' | 'DATE' | 'TIME' | 'STATUS'; title: string; message: string };
type Input = { startsAt: string; baseMinutes: number; totalMinutes: number; minimumMinutes: number; availableUntil?: string; availableUntilReason?: string; staffName?: string; now?: number };
export function bookingTimingNotice(input: Input): BookingTimingNotice | null {
  const { startsAt, baseMinutes, totalMinutes, minimumMinutes, staffName, now = Date.now() } = input;
  const start = Date.parse(startsAt);
  if (!Number.isFinite(start) || !Number.isFinite(totalMinutes) || totalMinutes <= 0) return { kind: 'TIME', title: 'Kiểm tra ngày giờ', message: 'Vui lòng chọn ngày giờ và thời lượng hợp lệ.' };
  const date = new Date(start + 7 * 3600000).toISOString().slice(0, 10);
  const closing = Date.parse(`${date}T20:00:00+07:00`);
  const staffEnd = Date.parse(input.availableUntil || '');
  const limit = Number.isFinite(staffEnd) ? Math.min(closing, staffEnd) : closing;
  const available = Math.max(0, (limit - start) / 60000);
  const startIssue = customerSlotIssue(startsAt, 30, now);
  if (startIssue && available >= 30) return { kind: 'TIME', title: 'Cần chọn lại ngày giờ', message: startIssue + ' Vui lòng quay lại chọn giờ khác hoặc ngày khác.' };
  if (totalMinutes <= available) return null;
  const endLabel = new Date(limit).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
  const reason = input.availableUntilReason === 'NEXT_BOOKING'
    ? `Nhân viên ${staffName || ''} cần thời gian di chuyển đến ca tiếp theo sau ${endLabel}.`
    : Number.isFinite(staffEnd) && staffEnd < closing
      ? `Nhân viên ${staffName || ''} chỉ đăng ký rảnh đến ${endLabel} trong khung giờ này.`
      : 'Thời gian làm việc tối đa trong ngày kết thúc lúc 20:00.';
  if (minimumMinutes > available) {
    const today = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
    return { kind: 'DATE', title: 'Không còn đủ thời gian làm việc', message: `${reason} Khoảng thời gian còn lại không đủ cho gói ngắn nhất. Vui lòng chọn giờ sớm hơn${date === today ? ', ngày mai' : ''} hoặc ngày khác.` };
  }
  if (baseMinutes <= available && totalMinutes > baseMinutes) return { kind: 'EXTRAS', title: 'Dịch vụ thêm làm vượt thời gian', message: `${reason} Gói chính vẫn phù hợp, nhưng tổng thời gian sau khi cộng dịch vụ thêm đã vượt giới hạn. Vui lòng bỏ bớt dịch vụ thêm hoặc quay lại chọn ngày/giờ khác.` };
  return { kind: 'PACKAGE', title: 'Gói làm việc vượt thời gian', message: `${reason} Gói đang chọn dài hơn thời gian nhân viên có thể làm. Vui lòng chọn gói ngắn hơn${totalMinutes > baseMinutes ? ', đồng thời giảm dịch vụ thêm nếu cần' : ''}, hoặc quay lại chọn ngày/giờ khác.` };
}
