import type { User, Staff } from '../types/user';
import type { StaffCapabilityActor, StaffCapabilityRecord, StaffCapabilityView, CapabilityRestrictionRecord, CapabilityRestrictionView } from '../types/staff-capability';
import { getStaffIdByUserId } from './staffMapping';

export const CAPABILITY_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export function getCapabilityActor(user: User | null, staff: Staff | null): StaffCapabilityActor | null {
  if (!user || user.role !== 'STAFF' || !staff || staff.userId !== user.id || getStaffIdByUserId(user.id) !== staff.id) return null;
  return { userId: user.id, staffId: staff.id };
}
const validInstant = (value?: string) => value === undefined || Number.isFinite(Date.parse(value));
export function adaptCapabilityRestriction(record: CapabilityRestrictionRecord, now: number): CapabilityRestrictionView {
  const malformed = !record.startsAt || !validInstant(record.startsAt) || !validInstant(record.endsAt)
    || (record.endsAt !== undefined && Date.parse(record.endsAt) <= Date.parse(record.startsAt));
  const isActive = record.status === 'ACTIVE' && (malformed ||
    (now >= Date.parse(record.startsAt) && (record.endsAt === undefined || now < Date.parse(record.endsAt))));
  return { ...record, isActive, blocksReceiving: isActive && record.type !== 'WARNING',
    statusLabel: record.status === 'REVOKED' ? 'Đã được gỡ' : malformed ? 'Cần kiểm tra hiệu lực'
      : record.status === 'EXPIRED' || (record.endsAt !== undefined && now >= Date.parse(record.endsAt)) ? 'Đã hết hạn'
      : isActive ? 'Đang áp dụng' : 'Chưa bắt đầu' };
}
export function adaptStaffCapability(record: StaffCapabilityRecord, restrictions: readonly CapabilityRestrictionView[], now: number): StaffCapabilityView {
  const related = restrictions.filter((item) => item.staffId === record.staffId && (!item.serviceId || item.serviceId === record.serviceId));
  const block = related.find((item) => item.blocksReceiving);
  const approved = record.status === 'APPROVED' && !!record.approvedAt && validInstant(record.approvedAt)
    && Date.parse(record.approvedAt) <= now;
  let state: StaffCapabilityView['state'] = 'INACTIVE';
  let reason: string | undefined;
  if (block) { state = 'SUSPENDED'; reason = block.reason; }
  else if (record.status === 'PENDING') { state = 'PENDING'; reason = 'Admin chưa xác nhận năng lực cho dịch vụ này.'; }
  else if (record.status === 'REJECTED') { state = 'REJECTED'; reason = 'Năng lực chưa được xác nhận. Vui lòng liên hệ người phụ trách hồ sơ.'; }
  else if (!approved) { reason = record.status === 'INACTIVE' ? 'Xác nhận năng lực không còn hiệu lực.' : 'Chưa có xác nhận hợp lệ của Admin.'; }
  else if (!validInstant(record.validFrom) || !validInstant(record.validUntil)
    || (record.validFrom && record.validUntil && Date.parse(record.validUntil) <= Date.parse(record.validFrom))) { reason = 'Thông tin hiệu lực cần được kiểm tra lại.'; }
  else if (record.validUntil && now >= Date.parse(record.validUntil)) { state = 'EXPIRED'; reason = 'Năng lực đã hết hiệu lực. Cần xác minh lại trước khi nhận dịch vụ.'; }
  else if (record.validFrom && now < Date.parse(record.validFrom)) { state = 'NOT_YET_VALID'; reason = 'Xác nhận chưa đến ngày có hiệu lực.'; }
  else state = 'VALID';
  const labels: Record<StaffCapabilityView['state'], string> = {
    VALID: 'Còn hiệu lực', PENDING: 'Chờ xác nhận', REJECTED: 'Chưa được xác nhận', INACTIVE: 'Không còn hiệu lực',
    EXPIRED: 'Hết hiệu lực', NOT_YET_VALID: 'Chưa có hiệu lực', SUSPENDED: 'Bị đình chỉ nhận dịch vụ',
  };
  return { id: record.id, serviceId: record.serviceId, serviceName: record.serviceName, experienceYears: record.experienceYears,
    approvalLabel: approved ? 'Đã được Admin xác nhận' : 'Chưa có xác nhận đang có hiệu lực',
    state, stateLabel: labels[state], canReceive: state === 'VALID', reason,
    ...(record.staffMayViewApproval ? { approvedAt: record.approvedAt, approvedByName: record.approvedByName } : {}),
    ...(record.staffMayViewNote ? { note: record.note } : {}),
    scope: [...record.scope], validFrom: record.validFrom, validUntil: record.validUntil, restrictions: related };
}
export function formatCapabilityDate(value?: string): string {
  if (!value) return 'Chưa có thông tin';
  if (!validInstant(value)) return 'Cần kiểm tra lại';
  return new Date(value).toLocaleString('vi-VN', { timeZone: CAPABILITY_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
