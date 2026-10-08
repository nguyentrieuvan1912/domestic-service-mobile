import { useStaffCapabilities } from './use-staff-capabilities';

// Same scoped read model as Profile and Account details. Mutations recheck in
// StaffRepository; a displayed approval is never a substitute for that check.
export function useStaffServiceEligibility() {
  const { actor, status, data } = useStaffCapabilities();
  return (serviceId: string): { allowed: boolean; reason?: string } => {
    if (!actor) return { allowed: false, reason: 'Vui lòng đăng nhập tài khoản nhân viên có hồ sơ hợp lệ.' };
    if (status !== 'READY' || !data) return { allowed: false, reason: status === 'ERROR'
      ? 'Chưa kiểm tra được năng lực. Mở Năng lực được xác nhận để thử lại.' : 'Đang kiểm tra năng lực nhận dịch vụ…' };
    const capability = data.capabilities.find((item) => item.serviceId === serviceId);
    return capability ? { allowed: capability.canReceive, reason: capability.reason }
      : { allowed: false, reason: 'Bạn chưa có năng lực được Admin xác nhận cho dịch vụ này.' };
  };
}
