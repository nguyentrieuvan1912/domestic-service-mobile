import type { MatchContext, MatchEligibility, MatchingOpportunity, MatchingSnapshot, MatchingFilter, MatchItem, MatchReasonCode } from '../types/staff-matching';
import { canScheduleBooking, intervalContains, localDate, scheduleDates, STAFF_SCHEDULE_POLICY } from './staffAvailabilityRules';
import { areaNamesForIds } from './staffAreas';

export const STAFF_MATCHING_POLICY = { requireOnline: true, defaultSort: 'START_TIME' as const };

// Pure evaluation: caller supplies owned, current snapshots and one captured clock.
// BUSY may receive a future non-conflicting job; OFFLINE is the persisted operational toggle.
export function evaluateOpportunity(context: MatchContext, job: MatchingOpportunity, now: number): MatchEligibility {
  const result: MatchEligibility = { allowed: true, reasons: [], checks: [] };
  const check = (code: MatchReasonCode, label: string, passed: boolean, detail: string, failure: string) => {
    result.checks.push({ code, label, passed, detail: passed ? detail : failure });
    if (!passed) result.reasons.push({ code, message: failure });
  };
  check('INACTIVE', 'Tài khoản đang hoạt động', context.userActive, 'Tài khoản nhân viên đang hoạt động.', 'Tài khoản chưa được phép nhận việc. Liên hệ người phụ trách hồ sơ.');
  check('OFFLINE', 'Đang bật nhận việc', !STAFF_MATCHING_POLICY.requireOnline || context.isOnline, 'Bạn đang bật nhận việc.', 'Bạn đang tạm nghỉ. Bật nhận việc để xem các ca phù hợp; ca đã nhận vẫn giữ nguyên.');
  const restrictions = context.capabilities.restrictions.filter(item => item.type !== 'WARNING' && item.status === 'ACTIVE'
    && (item.blocksReceiving || (Date.parse(item.startsAt) < Date.parse(job.endsAt) && (!item.endsAt || Date.parse(item.endsAt) > Date.parse(job.startsAt))))
    && (!item.serviceId || [job.serviceId, ...job.requiredCapabilities].includes(item.serviceId)));
  const restricted = context.staffStatus === 'SUSPENDED' || context.staffStatus === 'RESTRICTED';
  check('RESTRICTION', 'Không bị hạn chế nhận dịch vụ', !restricted && !restrictions.length, 'Không có hạn chế nhận dịch vụ đang áp dụng.', restrictions[0]?.reason ?? 'Hồ sơ đang bị hạn chế nhận việc. Xem Năng lực được xác nhận để biết thêm.');
  for (const id of [...new Set([job.serviceId, ...job.requiredCapabilities])]) {
    const capability = context.capabilities.capabilities.find(item => item.serviceId === id);
    const coversJob = !!capability?.canReceive && (!capability.validFrom || Date.parse(capability.validFrom) <= Date.parse(job.startsAt))
      && (!capability.validUntil || Date.parse(capability.validUntil) >= Date.parse(job.endsAt));
    check(capability ? 'CAPABILITY_INVALID' : 'CAPABILITY_MISSING', `Năng lực ${capability?.serviceName ?? (id === job.serviceId ? job.serviceName : id)}`,
      coversJob, 'Năng lực được Admin xác nhận và còn hiệu lực trong toàn bộ ca.', capability?.reason ?? (capability ? 'Hiệu lực năng lực không bao trọn ca làm việc. Cần xác minh lại trước khi nhận.' : 'Bạn chưa có năng lực được Admin xác nhận cho dịch vụ này.'));
  }
  check('NOT_INVITED', 'Chế độ nhận việc', job.mode === 'B' || job.invitedStaffId === context.actor.staffId,
    job.mode === 'B' ? 'Nhận một vị trí còn trống; bạn cần xác nhận.' : 'Khách chọn bạn; bạn vẫn cần xác nhận lời mời.', 'Lời mời này không dành cho bạn.');
  check('ALREADY_ASSIGNED', 'Chưa nhận vị trí trong ca này', !context.schedule.bookings.some(item => item.id === job.id && item.status !== 'CANCELLED'), 'Bạn chưa nhận một vị trí trong ca này.', 'Bạn đã nhận ca này. Mở Ca làm việc để xem assignment của mình.');
  check('POSITION_FULL', 'Còn vị trí để nhận', Number.isInteger(job.positionsRequired) && job.positionsRequired > 0 && Number.isInteger(job.positionsRemaining) && job.positionsRemaining > 0 && job.positionsRemaining <= job.positionsRequired,
    `Còn ${job.positionsRemaining}/${job.positionsRequired} vị trí.`, 'Ca không còn vị trí trống hoặc số vị trí cần xác minh.');
  check('NO_AVAILABILITY', 'Có lịch rảnh đã lưu', context.schedule.saved.days.some(day => day.intervals.length > 0), 'Đã đăng ký khoảng rảnh trong 7 ngày.', 'Bạn chưa lưu lịch rảnh. Đăng ký lịch trước khi nhận việc.');
  check('AREA_OUTSIDE', 'Trong khu vực đã chọn', areaNamesForIds(context.schedule.saved.areaIds).includes(job.district), `${job.district} thuộc khu vực đã lưu.`, 'Ca nằm ngoài khu vực bạn đã lưu.');
  const validTime = Number.isFinite(Date.parse(job.startsAt)) && Number.isFinite(Date.parse(job.endsAt)) && Date.parse(job.startsAt) < Date.parse(job.endsAt);
  const date = validTime ? localDate(job.startsAt) : '';
  const contained = validTime && context.schedule.saved.days.find(day => day.date === date)?.intervals.some(interval => intervalContains(interval, job));
  check('OUTSIDE_AVAILABILITY', 'Toàn bộ ca trong lịch rảnh', !!contained, 'Giờ bắt đầu và kết thúc nằm trong một khoảng rảnh đã lưu.', 'Toàn bộ thời gian ca phải nằm trong một khoảng rảnh đã lưu.');
  const schedule = context.schedule.unknownBookingCodes.length ? { allowed: false as const, code: 'SCHEDULE_INVALID' as const, reason: 'Cần xác minh giờ ca đã nhận trước khi nhận thêm việc.' }
    : canScheduleBooking(context.schedule.saved, { ...job, status: 'OPEN' }, context.schedule.bookings, now);
  check(!schedule.allowed ? schedule.code ?? 'SCHEDULE_INVALID' : 'BOOKING_CONFLICT', 'Kiểm tra giờ, lịch và vùng đệm', schedule.allowed,
    `Ca trong ${STAFF_SCHEDULE_POLICY.startMinute / 60}–${STAFF_SCHEDULE_POLICY.endMinute / 60}h, thuộc ${scheduleDates(now).length} ngày và không trùng ca/vùng đệm ${STAFF_SCHEDULE_POLICY.bufferMinutes} phút.`, !schedule.allowed ? schedule.reason : 'Chưa kiểm tra được lịch.');
  result.reasons = result.reasons.filter((reason, index, list) => list.findIndex(item => item.code === reason.code && item.message === reason.message) === index);
  result.allowed = result.reasons.length === 0;
  return result;
}
export function normalizeSearch(value: string): string { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim(); }
export function selectMatchingItems(snapshot: MatchingSnapshot, filter: MatchingFilter): MatchItem[] {
  const query = normalizeSearch(filter.query);
  return snapshot.items.filter(item => item.eligibility.allowed
    && (!filter.district || filter.district === 'Tất cả' || item.opportunity.district === filter.district)
    && normalizeSearch([item.opportunity.serviceName, item.opportunity.packageTitle, item.opportunity.district, item.opportunity.bookingCode].join(' ')).includes(query))
    .sort((a, b) => (filter.sort === 'INCOME' ? b.opportunity.netIncome - a.opportunity.netIncome : Date.parse(a.opportunity.startsAt) - Date.parse(b.opportunity.startsAt))
      || Date.parse(a.opportunity.startsAt) - Date.parse(b.opportunity.startsAt) || a.opportunity.id.localeCompare(b.opportunity.id));
}
export type MatchingEmptyKind = 'INACTIVE' | 'OFFLINE' | 'RESTRICTED' | 'NO_CAPABILITY' | 'NO_SCHEDULE' | 'NO_JOBS' | 'NO_MATCH' | 'FILTERED';
export function matchingEmptyKind(snapshot: MatchingSnapshot, hasFilters: boolean): MatchingEmptyKind {
  const c = snapshot.context;
  if (!c.userActive) return 'INACTIVE';
  if (STAFF_MATCHING_POLICY.requireOnline && !c.isOnline) return 'OFFLINE';
  if (c.staffStatus === 'SUSPENDED' || c.staffStatus === 'RESTRICTED' || c.capabilities.restrictions.some(item => item.blocksReceiving && !item.serviceId)) return 'RESTRICTED';
  if (!c.capabilities.eligibleCount) return 'NO_CAPABILITY';
  if (!c.schedule.saved.days.some(day => day.intervals.length)) return 'NO_SCHEDULE';
  if (!snapshot.items.length) return 'NO_JOBS';
  if (hasFilters && snapshot.items.some(item => item.eligibility.allowed)) return 'FILTERED';
  return 'NO_MATCH';
}
