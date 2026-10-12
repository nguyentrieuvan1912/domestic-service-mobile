import type { AvailabilityActor, AvailabilityDraft, AvailabilitySnapshot } from '../types/staff-availability';
import { StaffRepository } from './staffRepository';
import { getUserIdByStaffId } from './staffMapping';
import { mockUsers } from './users';
import { mockStaffs } from './staffs';

export const AVAILABILITY_DEMO_CONFIG = { latencyMs: 300, failNextLoad: false, failNextSave: false };
function assertActor(actor: AvailabilityActor): void {
  if (getUserIdByStaffId(actor.staffId) !== actor.userId || !mockUsers.some(user => user.id === actor.userId && user.role === 'STAFF')
    || !mockStaffs.some(staff => staff.id === actor.staffId && staff.userId === actor.userId)) throw new Error('Bạn không có quyền truy cập lịch của nhân viên này.');
}
function wait(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new Error('Đã hủy thao tác.')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, AVAILABILITY_DEMO_CONFIG.latencyMs);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  });
}
export function availabilityDraft(snapshot: AvailabilitySnapshot): AvailabilityDraft {
  const { days, areaIds, matchNotifications } = snapshot.saved;
  return JSON.parse(JSON.stringify({ days, areaIds, matchNotifications }));
}
export const StaffAvailabilityRepository = {
  async load(actor: AvailabilityActor, signal?: AbortSignal): Promise<AvailabilitySnapshot> {
    assertActor(actor);
    await wait(signal);
    if (AVAILABILITY_DEMO_CONFIG.failNextLoad) { AVAILABILITY_DEMO_CONFIG.failNextLoad = false; throw new Error('Chưa tải được lịch. Vui lòng thử lại.'); }
    return StaffRepository.getScheduleSnapshot(actor.staffId);
  },
  async save(actor: AvailabilityActor, draft: AvailabilityDraft, revision: number, signal?: AbortSignal): Promise<AvailabilitySnapshot> {
    assertActor(actor);
    const submitted = JSON.parse(JSON.stringify(draft)) as AvailabilityDraft;
    await wait(signal);
    if (AVAILABILITY_DEMO_CONFIG.failNextSave) { AVAILABILITY_DEMO_CONFIG.failNextSave = false; throw new Error('Chưa lưu được lịch. Bản nháp vẫn được giữ để thử lại.'); }
    StaffRepository.saveSchedule(actor.staffId, submitted, revision);
    return StaffRepository.getScheduleSnapshot(actor.staffId);
  },
};
