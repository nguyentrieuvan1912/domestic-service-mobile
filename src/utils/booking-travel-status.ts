import type { ConnectedBooking } from '../data/connectedBookings';

export function bookingTravelStatus(booking: Pick<ConnectedBooking, 'status' | 'assignments'>) {
  if (['CANCELLED', 'REJECTED', 'NO_STAFF_FOUND', 'REFUNDED'].includes(booking.status)) {
    return { active: false, description: 'Đơn đã kết thúc.' };
  }
  const assignments = booking.assignments.filter(item => ['ACCEPTED', 'COMPLETED'].includes(item.status));
  const travelling = assignments.some(item => item.executionStatus === 'EN_ROUTE');
  const arrived = ['IN_PROGRESS', 'COMPLETED'].includes(booking.status) || assignments.some(item => ['IN_PROGRESS', 'COMPLETED'].includes(item.executionStatus));
  return {
    active: travelling || arrived,
    description: travelling ? 'Nhân viên đang trên đường đến địa chỉ của bạn' : arrived ? 'Nhân viên đã đến địa điểm làm việc' : 'Sẽ cập nhật khi nhân viên bắt đầu di chuyển',
  };
}
