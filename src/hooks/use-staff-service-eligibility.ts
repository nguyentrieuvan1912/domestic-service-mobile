import { useStaffCapabilities } from './use-staff-capabilities';
import { useSyncExternalStore } from 'react';
import { StaffRepository } from '@/data/staffRepository';

// Same scoped read model as Profile and Account details. Mutations recheck in
// StaffRepository; a displayed approval is never a substitute for that check.
export function useStaffServiceEligibility() {
  const { actor, status, data } = useStaffCapabilities();
  const revision = useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  return (serviceId: string, opportunityId?: string): { allowed: boolean; reason?: string } => {
    if (!actor) return { allowed: false, reason: 'Vui lòng đăng nhập tài khoản nhân viên có hồ sơ hợp lệ.' };
    if (status !== 'READY' || !data) return { allowed: false, reason: status === 'ERROR'
      ? 'Chưa kiểm tra được năng lực. Mở Năng lực được xác nhận để thử lại.' : 'Đang kiểm tra năng lực nhận dịch vụ…' };
    const capability = data.capabilities.find((item) => item.serviceId === serviceId);
    if (!capability?.canReceive) return { allowed: false, reason: capability?.reason ?? 'Bạn chưa có năng lực được Admin xác nhận cho dịch vụ này.' };
    // Revision drives rendering after saved schedule/booking changes; drafts never notify this store.
    if (opportunityId && revision >= 0) {
      const result = StaffRepository.getOpportunityEligibility(actor.staffId, opportunityId);
      return { allowed: result.allowed, reason: result.reasons.map(item => item.message).join('\n') || undefined };
    }
    return { allowed: true };
  };
}
