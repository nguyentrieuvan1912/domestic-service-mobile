import { Penalty } from '../types/user';

export const mockPenalties: Penalty[] = [
  {
    id: 'pen-001',
    staffId: 'staff-010',
    bookingId: 'bk-023',
    reason: 'Hủy đơn dịch vụ dưới 2 giờ trước giờ hẹn mà không có lý do chính đáng',
    amount: 100000,
    createdAt: '2024-05-15T14:30:00Z',
    status: 'APPLIED',
  },
  {
    id: 'pen-002',
    staffId: 'staff-010',
    bookingId: 'bk-024',
    reason: 'Đến muộn quá 45 phút không thông báo cho khách hàng',
    amount: 50000,
    createdAt: '2024-05-22T09:15:00Z',
    status: 'APPLIED',
  },
  {
    id: 'pen-003',
    staffId: 'staff-011',
    bookingId: 'bk-025',
    reason: 'Thái độ thiếu lịch sự, vi phạm nghiêm trọng quy chuẩn ứng xử với khách hàng',
    amount: 200000,
    createdAt: '2024-04-08T16:00:00Z',
    status: 'APPLIED',
  },
  {
    id: 'pen-004',
    staffId: 'staff-005',
    bookingId: 'bk-026',
    reason: 'Làm hỏng thiết bị vệ sinh của khách hàng trong quá trình thực hiện',
    amount: 150000,
    createdAt: '2024-03-12T10:00:00Z',
    status: 'WAIVED', // Đã được miễn sau khi nhân viên chủ động bồi thường trực tiếp
  },
  {
    id: 'pen-005',
    staffId: 'staff-003',
    bookingId: 'bk-027',
    reason: 'Từ chối đơn Matching vượt quá tỷ lệ 3 lần liên tiếp trong tuần',
    amount: 50000,
    createdAt: '2024-02-18T18:00:00Z',
    status: 'APPEALED', // Đang khiếu nại do trùng lịch cấp cứu
  },
];
