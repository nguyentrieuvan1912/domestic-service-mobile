import { StaffRestriction } from '../types/user';

export const mockStaffRestrictions: StaffRestriction[] = [
  {
    id: 'res-001',
    staffId: 'staff-010',
    reason: 'Hủy đơn cận giờ nhiều lần: Tạm dừng quyền nhận đơn Matching tự động trong 7 ngày',
    startDate: '2024-06-10T00:00:00Z',
    endDate: '2024-06-17T23:59:59Z',
    status: 'ACTIVE',
  },
  {
    id: 'res-002',
    staffId: 'staff-011',
    reason: 'Đang giải quyết khiếu nại khách hàng: Tạm khóa toàn bộ quyền nhận đơn mới trên hệ thống',
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-06-30T23:59:59Z',
    status: 'ACTIVE',
  },
  {
    id: 'res-003',
    staffId: 'staff-005',
    reason: 'Tạm ngưng do điểm đánh giá trung bình tuần giảm dưới 4.0 sao',
    startDate: '2024-03-15T00:00:00Z',
    endDate: '2024-03-22T23:59:59Z',
    status: 'EXPIRED',
  },
  {
    id: 'res-004',
    staffId: 'staff-003',
    reason: 'Hạn chế nhận việc ngoài giờ hành chính do khiếu nại tiếng ồn',
    startDate: '2024-01-10T00:00:00Z',
    endDate: '2024-01-20T23:59:59Z',
    status: 'REVOKED',
  },
];
