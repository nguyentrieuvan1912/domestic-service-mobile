import type { StaffCapabilityActor, StaffCapabilitySnapshot, StaffCapabilityView } from '../types/staff-capability';
import { mockStaffs } from './staffs';
import { mockUsers } from './users';
import { getStaffIdByUserId, getUserIdByStaffId } from './staffMapping';
import { mockStaffCapabilities, mockCapabilityRestrictions } from './staffCapabilities';
import { adaptStaffCapability, adaptCapabilityRestriction } from './staffCapabilityAdapter';

export const CAPABILITY_DEMO_CONFIG = { latencyMs: 300, failNextLoad: false };
function assertActor(actor: StaffCapabilityActor | null): asserts actor is StaffCapabilityActor {
  if (!actor || getStaffIdByUserId(actor.userId) !== actor.staffId
    || !mockUsers.some((user) => user.id === actor.userId && user.role === 'STAFF')
    || !mockStaffs.some((staff) => staff.id === actor.staffId && staff.userId === actor.userId)) {
    throw new Error('Vui lòng đăng nhập bằng tài khoản nhân viên có hồ sơ hợp lệ.');
  }
}
function wait(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new Error('Đã hủy thao tác.')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, CAPABILITY_DEMO_CONFIG.latencyMs);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  });
}
export const StaffCapabilityRepository = {
  getSnapshot(actor: StaffCapabilityActor | null, now = Date.now()): StaffCapabilitySnapshot {
    assertActor(actor);
    const restrictions = mockCapabilityRestrictions.filter((item) => item.staffId === actor.staffId).map((item) => adaptCapabilityRestriction(item, now));
    const staff = mockStaffs.find((item) => item.id === actor.staffId);
    const staffRestricted = staff?.status === 'SUSPENDED' || staff?.status === 'RESTRICTED';
    const capabilities = mockStaffCapabilities.filter((item) => item.staffId === actor.staffId).map((item) => {
      const view = adaptStaffCapability(item, restrictions, now);
      return staffRestricted ? { ...view, canReceive: false, state: 'SUSPENDED' as const, stateLabel: 'Bị đình chỉ nhận dịch vụ',
        reason: 'Hồ sơ đang bị hạn chế nhận việc. Vui lòng liên hệ người phụ trách.' } : view;
    });
    return { capabilities, restrictions, eligibleCount: capabilities.filter((item) => item.canReceive).length, checkedAt: new Date(now).toISOString() };
  },
  getDetail(actor: StaffCapabilityActor | null, id: string, now = Date.now()): StaffCapabilityView {
    const record = this.getSnapshot(actor, now).capabilities.find((item) => item.id === id);
    if (!record) throw new Error('Không tìm thấy năng lực trong hồ sơ của bạn.');
    return record;
  },
  async load(actor: StaffCapabilityActor | null, signal?: AbortSignal): Promise<StaffCapabilitySnapshot> {
    await wait(signal);
    if (signal?.aborted) throw new Error('Đã hủy thao tác.');
    assertActor(actor);
    if (CAPABILITY_DEMO_CONFIG.failNextLoad) { CAPABILITY_DEMO_CONFIG.failNextLoad = false; throw new Error('Chưa tải được năng lực. Vui lòng thử lại.'); }
    return this.getSnapshot(actor);
  },
  canReceiveService(staffId: string, serviceId: string, now = Date.now()): { allowed: boolean; reason?: string } {
    const userId = getUserIdByStaffId(staffId);
    let snapshot: StaffCapabilitySnapshot;
    try { snapshot = this.getSnapshot(userId ? { userId, staffId } : null, now); }
    catch { return { allowed: false, reason: 'Hồ sơ nhân viên chưa hợp lệ để kiểm tra năng lực.' }; }
    const capability = snapshot.capabilities.find((item) => item.serviceId === serviceId);
    return capability ? { allowed: capability.canReceive, reason: capability.reason }
      : { allowed: false, reason: 'Bạn chưa có năng lực được Admin xác nhận cho dịch vụ này.' };
  },
};
